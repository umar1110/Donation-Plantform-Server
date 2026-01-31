-- Donor and donation table 
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    auth_user_id UUID  NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    is_amount_split BOOLEAN DEFAULT FALSE,
    tax_deductible_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_deductible_amount >= 0),
    tax_non_deductible_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_non_deductible_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    donation_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (
        payment_method IN ('cash', 'check', 'bank_transfer', 'stripe', 'other')
    ),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    type VARCHAR(50) DEFAULT 'one-time' CHECK (type IN ('one-time', 'recurring')),
    created_by_admin_id UUID NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    -- Privacy
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Additional Info
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()

    -- Constraints
    CONSTRAINT valid_tax_split CHECK (
        NOT is_amount_split OR 
        (tax_deductible_amount + tax_non_deductible_amount = amount)
    ),
    CONSTRAINT valid_amount CHECK (amount > 0)
);


-- ============================================
-- RECEIPTS TABLE (per organization)
-- No PDF storage - generated on-demand with React-PDF
-- ============================================
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    -- Link to donation
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE RESTRICT,
    
    -- UNIQUE RECEIPT NUMBER ( generate in app code )
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    

    -- SNAPSHOT of data at time of receipt issue (immutable)
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    is_amount_split BOOLEAN NOT NULL,
    tax_deductible_amount NUMERIC(12, 2) NOT NULL,
    tax_non_deductible_amount NUMERIC(12, 2) NOT NULL, -- Meal or service 
    donation_date TIMESTAMPTZ NOT NULL,
    
    -- Organization snapshot (in case org details change later)
    org_name VARCHAR(255) NOT NULL,
    org_abn VARCHAR(50),
    org_address TEXT,
    
    -- Email tracking (did we send receipt email?)
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    
    -- Status & audit trail
    status VARCHAR(20) DEFAULT 'issued' CHECK (
        status IN ('issued', 'void', 'amended')
    ),
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    
    -- ATO Compliance: 7-year retention requirement
    retention_until TIMESTAMPTZ NOT NULL,
    
    -- Who issued this receipt
    issued_by_admin_id UUID REFERENCES user_profiles(id),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(), -- When receipt was issued
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Generic trigger function to update updated_at on modification
-- Works for any table with an updated_at column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER trg_donors_updated_at
BEFORE UPDATE ON donors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_donations_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_receipts_updated_at
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Indexes for performance

CREATE INDEX IF NOT EXISTS idx_donors_email
  ON donors(email);        
CREATE INDEX IF NOT EXISTS idx_donations_donor_id
  ON donations(donor_id);        
CREATE INDEX IF NOT EXISTS idx_donations_status
  ON donations(status);        
CREATE INDEX IF NOT EXISTS idx_receipts_donation_id
  ON receipts(donation_id);        
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number
  ON receipts(receipt_number);  
CREATE INDEX IF NOT EXISTS idx_receipts_status
    ON receipts(status);
CReatE INDEX IF NOT EXISTS idx_auth_user_id_in_donors
    ON donors(auth_user_id);
