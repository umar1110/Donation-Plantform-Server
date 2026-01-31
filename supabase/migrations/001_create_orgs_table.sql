-- Migration 001: Create orgs (Schools) Table
-- This table lives in the public schema and manages all orgs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create orgs table
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255) NULL,
    description TEXT NOT NULL,
    ABN VARCHAR(20) NULL,
    type VARCHAR(50) NULL, -- TODO: Convert in Number or Enum later
    country VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL, -- Can be state, province, region, etc.
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,


    -- Unique Identifiers
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    
    -- Receipt Number Generation
    -- Prefix derived from state_province (e.g., "NSW", "VIC", "QLD")
    receipt_prefix VARCHAR(10) NOT NULL,
    receipt_sequence INT DEFAULT 0, -- Current sequence number
    receipt_sequence_year INT DEFAULT EXTRACT(YEAR FROM NOW()), -- Year for sequence reset
    
    -- Owner Information (from Supabase Auth)
    owner_id UUID NULL, -- References auth.users(id) from Supabase
    owner_email VARCHAR(255) NULL,
    
    -- Subscription & Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium', 'enterprise')),
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_subdomain CHECK (subdomain ~* '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^(https?://)?([a-z0-9.-]+)(:[0-9]{1,5})?(/.*)?$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id
  ON orgs(owner_id);

CREATE INDEX IF NOT EXISTS idx_orgs_subdomain
  ON orgs(subdomain); 

CREATE INDEX IF NOT EXISTS idx_orgs_status
  ON orgs(status);

CREATE INDEX IF NOT EXISTS idx_orgs_plan
  ON orgs(plan);

CREATE INDEX IF NOT EXISTS idx_orgs_name
  ON orgs(name);

CREATE INDEX IF NOT EXISTS idx_orgs_abn
  ON orgs(ABN);

CREATE INDEX IF NOT EXISTS idx_orgs_type
  ON orgs(type);

CREATE INDEX IF NOT EXISTS idx_orgs_country
  ON orgs(country);

CREATE INDEX IF NOT EXISTS idx_orgs_deleted_at
  ON orgs(deleted_at)
  WHERE deleted_at IS NULL;


-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER update_orgs_updated_at
    BEFORE UPDATE ON orgs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Comments for documentation
COMMENT ON TABLE orgs IS 'Main org (school) table - each org gets its own schema';
COMMENT ON COLUMN orgs.owner_id IS 'References auth.users - the user who created/owns this org';
COMMENT ON COLUMN orgs.subdomain IS 'Unique subdomain for this org (e.g., greenvalley.school.com)';
COMMENT ON COLUMN orgs.settings IS 'org-specific settings (branding, features, etc.)';
COMMENT ON COLUMN orgs.metadata IS 'Additional metadata (address, contact info, etc.)';


-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON orgs TO authenticated;
GRANT SELECT ON orgs TO anon;