-- Migration 004: Enable Row Level Security (RLS) and add supporting indexes
-- Policies use auth.uid() (Supabase: current JWT user). Service role bypasses RLS.

-- =============================================================================
-- ORGS
-- =============================================================================
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Users can read orgs they own or belong to (via user_profiles)
CREATE POLICY "orgs_select_own_or_member"
ON orgs FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL
  )
);

-- Authenticated users can insert orgs (e.g. signup)
CREATE POLICY "orgs_insert_authenticated"
ON orgs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update orgs they own or are org admin for
CREATE POLICY "orgs_update_own_or_admin"
ON orgs FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT org_id FROM user_profiles
    WHERE auth_user_id = auth.uid() AND is_organization_admin = true AND org_id IS NOT NULL
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR id IN (
    SELECT org_id FROM user_profiles
    WHERE auth_user_id = auth.uid() AND is_organization_admin = true AND org_id IS NOT NULL
  )
);

-- =============================================================================
-- DONOR_PROFILES
-- =============================================================================
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read donors linked to their org(s)
CREATE POLICY "donor_profiles_select_org_member"
ON donor_profiles FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT od.donor_id FROM orgs_donors od
    INNER JOIN user_profiles up ON up.org_id = od.org_id AND up.auth_user_id = auth.uid()
    WHERE up.org_id IS NOT NULL
  )
);

-- Org members can insert donors (link is created via orgs_donors)
CREATE POLICY "donor_profiles_insert_authenticated"
ON donor_profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update donors that belong to their org
CREATE POLICY "donor_profiles_update_org_member"
ON donor_profiles FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT od.donor_id FROM orgs_donors od
    INNER JOIN user_profiles up ON up.org_id = od.org_id AND up.auth_user_id = auth.uid()
    WHERE up.org_id IS NOT NULL
  )
)
WITH CHECK (
  id IN (
    SELECT od.donor_id FROM orgs_donors od
    INNER JOIN user_profiles up ON up.org_id = od.org_id AND up.auth_user_id = auth.uid()
    WHERE up.org_id IS NOT NULL
  )
);

-- =============================================================================
-- ORGS_DONORS
-- =============================================================================
ALTER TABLE orgs_donors ENABLE ROW LEVEL SECURITY;

-- Users can read orgs_donors for their org(s)
CREATE POLICY "orgs_donors_select_org_member"
ON orgs_donors FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can insert orgs_donors for their org
CREATE POLICY "orgs_donors_insert_org_member"
ON orgs_donors FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can update/delete orgs_donors for their org
CREATE POLICY "orgs_donors_update_org_member"
ON orgs_donors FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
)
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

CREATE POLICY "orgs_donors_delete_org_member"
ON orgs_donors FOR DELETE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- =============================================================================
-- DONATIONS
-- =============================================================================
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Users can read donations for their org(s)
CREATE POLICY "donations_select_org_member"
ON donations FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can insert donations for their org
CREATE POLICY "donations_insert_org_member"
ON donations FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can update donations for their org
CREATE POLICY "donations_update_org_member"
ON donations FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
)
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Index for RLS and queries by org_id
CREATE INDEX IF NOT EXISTS idx_donations_org_id ON donations(org_id);

-- =============================================================================
-- RECEIPTS
-- =============================================================================
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Users can read receipts for their org(s)
CREATE POLICY "receipts_select_org_member"
ON receipts FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can insert receipts for their org
CREATE POLICY "receipts_insert_org_member"
ON receipts FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Org members can update receipts for their org
CREATE POLICY "receipts_update_org_member"
ON receipts FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
)
WITH CHECK (
  org_id IN (SELECT org_id FROM user_profiles WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL)
);

-- Index for RLS and queries by org_id
CREATE INDEX IF NOT EXISTS idx_receipts_org_id ON receipts(org_id);

-- =============================================================================
-- INDEXES FOR RLS / QUERIES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(org_id)
WHERE org_id IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE donor_profiles IS 'Donor contact and aggregate totals; linked to orgs via orgs_donors';
COMMENT ON TABLE orgs_donors IS 'Links donors to organizations; tracks per-org donation totals';
COMMENT ON TABLE donations IS 'Individual donations; anonymous or linked to a donor';
COMMENT ON TABLE receipts IS 'DGR donation receipts; immutable snapshot per donation';
