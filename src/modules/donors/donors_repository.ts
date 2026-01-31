import { PoolClient } from "pg";
import z from "zod";
import { createDonorSchema } from "./donors_schema";
import { pool } from "../../config/database";

export const insertDonor = async (data: z.infer<typeof createDonorSchema>) => {
  const { first_name, last_name, email, phone, address, auth_user_id, org_id } = data;
  const result = await pool.query(
    `INSERT INTO donors (first_name, last_name, email, phone, address, auth_user_id, org_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      first_name,
      last_name,
      email,
      phone || null,
      address || null,
      auth_user_id || null,
      org_id,
    ],
  );
  return result.rows[0];
};

export const selectDonorById = async (donorId: string) => {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, phone, address, auth_user_id, created_at, updated_at
     FROM donors
     WHERE id = $1`,
    [donorId],
  );
  return result.rows[0];
};
