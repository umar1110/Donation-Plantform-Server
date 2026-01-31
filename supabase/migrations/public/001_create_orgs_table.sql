-- Migration 001: Create orgs (Schools) Table
-- This table lives in the public schema and manages all orgs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create orgs table
CREATE TABLE IF NOT EXISTS public.orgs (
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
    schema_name VARCHAR(100) UNIQUE NOT NULL,
    
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
    CONSTRAINT valid_schema_name CHECK (schema_name ~* '^org_[a-z0-9_]+$'),
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^(https?://)?([a-z0-9.-]+)(:[0-9]{1,5})?(/.*)?$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id
  ON public.orgs(owner_id);

CREATE INDEX IF NOT EXISTS idx_orgs_subdomain
  ON public.orgs(subdomain);

CREATE INDEX IF NOT EXISTS idx_orgs_schema_name
  ON public.orgs(schema_name);

CREATE INDEX IF NOT EXISTS idx_orgs_status
  ON public.orgs(status);

CREATE INDEX IF NOT EXISTS idx_orgs_plan
  ON public.orgs(plan);

CREATE INDEX IF NOT EXISTS idx_orgs_name
  ON public.orgs(name);

CREATE INDEX IF NOT EXISTS idx_orgs_abn
  ON public.orgs(ABN);

CREATE INDEX IF NOT EXISTS idx_orgs_type
  ON public.orgs(type);

CREATE INDEX IF NOT EXISTS idx_orgs_country
  ON public.orgs(country);

CREATE INDEX IF NOT EXISTS idx_orgs_deleted_at
  ON public.orgs(deleted_at)
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
    BEFORE UPDATE ON public.orgs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Function to generate schema name from org name
CREATE OR REPLACE FUNCTION generate_schema_name(p_org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_base_name TEXT;
    v_schema_name TEXT;
    v_counter INT := 0;
BEGIN
    -- Clean and normalize the name
    v_base_name :=
        'org_' || regexp_replace(lower(p_org_name), '[^a-z0-9]', '_', 'g');

    v_schema_name := v_base_name;

    -- Ensure uniqueness
    WHILE EXISTS (
        SELECT 1
        FROM public.orgs t
        WHERE t.schema_name = v_schema_name
    ) LOOP
        v_counter := v_counter + 1;
        v_schema_name := v_base_name || '_' || v_counter;
    END LOOP;

    RETURN v_schema_name;
END;
$$ LANGUAGE plpgsql;


-- Comments for documentation
COMMENT ON TABLE public.orgs IS 'Main org (school) table - each org gets its own schema';
COMMENT ON COLUMN public.orgs.owner_id IS 'References auth.users - the user who created/owns this org';
COMMENT ON COLUMN public.orgs.schema_name IS 'PostgreSQL schema name where this org data lives';
COMMENT ON COLUMN public.orgs.subdomain IS 'Unique subdomain for this org (e.g., greenvalley.school.com)';
COMMENT ON COLUMN public.orgs.settings IS 'org-specific settings (branding, features, etc.)';
COMMENT ON COLUMN public.orgs.metadata IS 'Additional metadata (address, contact info, etc.)';


-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.orgs TO authenticated;
GRANT SELECT ON public.orgs TO anon;