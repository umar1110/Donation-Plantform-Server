import z from "zod";
import { pool } from "../../config/database";
import { createDonorSchema } from "./donors_schema";
import { supabase } from "../../config/supabase";

export const insertDonorProfile = async (
  data: z.infer<typeof createDonorSchema>,
) => {
  const { first_name, last_name, email, phone, address, auth_user_id, org_id } =
    data;
  const result = await pool.query(
    `INSERT INTO donor_profiles (first_name, last_name, email, phone, address, auth_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      first_name,
      last_name,
      email,
      phone || null,
      address || null,
      auth_user_id || null,
    ],
  );
  return result.rows[0];
};

export const selectDonorById = async (donorId: string) => {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, phone, address, auth_user_id, created_at, updated_at
     FROM donor_profiles
     WHERE id = $1`,
    [donorId],
  );
  return result.rows[0];
};

export const linkDonorToOrg = async (orgId: string, donorId: string) => {
  await supabase
    .from("orgs_donors")
    .insert({ org_id: orgId, donor_id: donorId });
};
