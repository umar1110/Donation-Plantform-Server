
-- In start , simple fields for user profile
CREATE TABLE IF NOT EXISTS user_profiles(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    is_organization_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger function to update updated_at on modification
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;    
-- Trigger to call the function before any update on user_profiles
CREATE TRIGGER trg_update_user_profile_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profile_updated_at();  


-- Index on auth_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_auth_user_id
ON user_profiles(auth_user_id);
