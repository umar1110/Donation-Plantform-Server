-- Migration 001: Create Tenants (Schools) Table
-- This table lives in the public schema and manages all tenants

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255) NULL,
    description TEXT NOT NULL,
    ABN VARCHAR(20) NULL,
    type VARCHAR(50) NULL,
    country VARCHAR(100) NULL,

    subdomain VARCHAR(100) UNIQUE NOT NULL,
    schema_name VARCHAR(100) UNIQUE NOT NULL,
    
    
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
    CONSTRAINT valid_schema_name CHECK (schema_name ~* '^tenant_[a-z0-9_]+$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id
  ON public.tenants(owner_id);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain
  ON public.tenants(subdomain);

CREATE INDEX IF NOT EXISTS idx_tenants_schema_name
  ON public.tenants(schema_name);

CREATE INDEX IF NOT EXISTS idx_tenants_status
  ON public.tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenants_plan
  ON public.tenants(plan);

CREATE INDEX IF NOT EXISTS idx_tenants_name
  ON public.tenants(name);

CREATE INDEX IF NOT EXISTS idx_tenants_abn
  ON public.tenants(ABN);

CREATE INDEX IF NOT EXISTS idx_tenants_type
  ON public.tenants(type);

CREATE INDEX IF NOT EXISTS idx_tenants_country
  ON public.tenants(country);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at
  ON public.tenants(deleted_at)
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
CREATE OR REPLACE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Function to generate schema name from tenant name
CREATE OR REPLACE FUNCTION generate_schema_name(p_tenant_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_base_name TEXT;
    v_schema_name TEXT;
    v_counter INT := 0;
BEGIN
    -- Clean and normalize the name
    v_base_name :=
        'tenant_' || regexp_replace(lower(p_tenant_name), '[^a-z0-9]', '_', 'g');

    v_schema_name := v_base_name;

    -- Ensure uniqueness
    WHILE EXISTS (
        SELECT 1
        FROM public.tenants t
        WHERE t.schema_name = v_schema_name
    ) LOOP
        v_counter := v_counter + 1;
        v_schema_name := v_base_name || '_' || v_counter;
    END LOOP;

    RETURN v_schema_name;
END;
$$ LANGUAGE plpgsql;


-- Comments for documentation
COMMENT ON TABLE public.tenants IS 'Main tenant (school) table - each tenant gets its own schema';
COMMENT ON COLUMN public.tenants.owner_id IS 'References auth.users - the user who created/owns this tenant';
COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name where this tenant data lives';
COMMENT ON COLUMN public.tenants.subdomain IS 'Unique subdomain for this tenant (e.g., greenvalley.school.com)';
COMMENT ON COLUMN public.tenants.settings IS 'Tenant-specific settings (branding, features, etc.)';
COMMENT ON COLUMN public.tenants.metadata IS 'Additional metadata (address, contact info, etc.)';


-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO anon;