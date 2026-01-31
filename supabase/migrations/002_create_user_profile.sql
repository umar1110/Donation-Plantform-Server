
-- In start , simple fields for user profile
CREATE TABLE IF NOT EXISTS user_profiles(
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Org admins can manage org users"
ON user_profiles
FOR UPDATE
USING (
  is_organization_admin = TRUE
  AND org_id IN (
    SELECT org_id
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);
