import type { PoolClient } from "pg";
import { pool } from "../../config/database";
import type { z } from "zod";
import { createDonorSchema } from "./donors_schema";

function queryClient(client: PoolClient | undefined) {
  return client ?? pool;
}

export const insertDonorProfile = async (
  data: z.infer<typeof createDonorSchema>,
  client?: PoolClient
) => {
  const { first_name, last_name, email, phone, address, country, state_province, city, auth_user_id } = data;
  const q = queryClient(client);
  const result = await q.query(
    `INSERT INTO donor_profiles (first_name, last_name, email, phone, address, country, state_province, city, auth_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      first_name,
      last_name,
      email,
      phone || null,
      address || null,
      country || null,
      state_province || null,
      city || null,
      auth_user_id || null,
    ]
  );
  return result.rows[0];
};

export const selectDonorById = async (
  donorId: string,
  client?: PoolClient
): Promise<Record<string, unknown> | undefined> => {
  const q = queryClient(client);
  const result = await q.query(
    `SELECT id, first_name, last_name, email, phone, address, country, state_province, city, auth_user_id, total_donations, donation_count, created_at, updated_at
     FROM donor_profiles
     WHERE id = $1`,
    [donorId]
  );
  return result.rows[0];
};

/** Alias for selectDonorById for use in donations service */
export const getDonorById = selectDonorById;

export const findDonorByEmailAndOrg = async (
  email: string,
  orgId: string,
  client?: PoolClient
): Promise<Record<string, unknown> | undefined> => {
  const q = queryClient(client);
  const result = await q.query(
    `SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.address, d.country, d.state_province, d.city, d.auth_user_id, d.total_donations, d.donation_count, d.created_at, d.updated_at
     FROM donor_profiles d
     INNER JOIN orgs_donors od ON d.id = od.donor_id
     WHERE LOWER(d.email) = LOWER($1) AND od.org_id = $2`,
    [email, orgId]
  );
  return result.rows[0];
};

/**
 * Find donor by email globally (internal use only - for duplicate prevention)
 * This is used by backend to check if email exists before creating new donor
 */
export const findDonorByEmail = async (
  email: string,
  client?: PoolClient
): Promise<Record<string, unknown> | undefined> => {
  const q = queryClient(client);
  const result = await q.query(
    `SELECT id, first_name, last_name, email, phone, address, country, state_province, city, auth_user_id, total_donations, donation_count, created_at, updated_at
     FROM donor_profiles
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return result.rows[0];
};

/**
 * Check if donor is already linked to organization
 */
export const isDonorLinkedToOrg = async (
  donorId: string,
  orgId: string,
  client?: PoolClient
): Promise<boolean> => {
  const q = queryClient(client);
  const result = await q.query(
    `SELECT 1 FROM orgs_donors WHERE donor_id = $1 AND org_id = $2`,
    [donorId, orgId]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

export const linkDonorToOrg = async (
  orgId: string,
  donorId: string,
  client?: PoolClient
) => {
  const q = queryClient(client);
  await q.query(
    `INSERT INTO orgs_donors (org_id, donor_id)
     VALUES ($1, $2)`,
    [orgId, donorId]
  );
};

export const updateDonorTotals = async (
  donorId: string,
  donationAmount: number,
  client?: PoolClient
) => {
  const q = queryClient(client);
  await q.query(
    `UPDATE donor_profiles
     SET total_donations = COALESCE(total_donations, 0) + $1,
         donation_count = COALESCE(donation_count, 0) + 1,
         updated_at = NOW()
     WHERE id = $2`,
    [donationAmount, donorId]
  );
};

export const updateOrgsDonorsTotals = async (
  orgId: string,
  donorId: string,
  donationAmount: number,
  client?: PoolClient
) => {
  const q = queryClient(client);
  await q.query(
    `UPDATE orgs_donors
     SET total_donations = COALESCE(total_donations, 0) + $1,
         donation_count = COALESCE(donation_count, 0) + 1,
         updated_at = NOW()
     WHERE org_id = $2 AND donor_id = $3`,
    [donationAmount, orgId, donorId]
  );
};

/**
 * Search donors by email, first_name, or last_name (partial match)
 * Only returns donors linked to the organization
 */
/**
 * Search donors by email, first_name, or last_name (partial match)
 * Only returns donors linked to the organization
 */
export const searchDonorsByOrg = async (
  orgId: string,
  searchTerm: string,
  limit: number = 10,
  client?: PoolClient
): Promise<Array<{
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country?: string | null;
  state_province?: string | null;
  city?: string | null;
}>> => {
  const q = queryClient(client);
  const searchPattern = `%${searchTerm.toLowerCase()}%`;
  
  const result = await q.query(
    `SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.country, d.state_province, d.city
     FROM donor_profiles d
     INNER JOIN orgs_donors od ON d.id = od.donor_id
     WHERE od.org_id = $1
       AND (
         LOWER(d.email) LIKE $2
         OR LOWER(d.first_name) LIKE $2
         OR LOWER(d.last_name) LIKE $2
       )
     ORDER BY d.first_name, d.last_name
     LIMIT $3`,
    [orgId, searchPattern, limit]
  );
  
  return result.rows;
};
