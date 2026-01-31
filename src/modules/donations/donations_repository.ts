import { z } from "zod";
import { pool } from "../../config/database";
import { createDonationSchema } from "./donations_schema";

export async function insertDonation(
  data: z.infer<typeof createDonationSchema>,
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO donations (donor_id, amount, is_amount_split, tax_deductible_amount, tax_non_deductible_amount, currency, payment_method, message, is_anonymous,org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
    [
      data.donor_id || null,
      data.amount,
      data.is_amount_split ?? false,
      data.tax_deductible_amount ?? 0,
      data.tax_non_deductible_amount ?? 0,
      data.currency,
      data.payment_method,
      data.message ?? null,
      data.is_anonymous ?? false,
      data.org_id,
    ],
  );
  return result.rows[0];
}
