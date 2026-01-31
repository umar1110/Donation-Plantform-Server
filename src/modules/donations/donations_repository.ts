import { PoolClient } from "pg";
import { z } from "zod";
import { createDonationSchema } from "./donations_schema";

export async function insertDonation(
  client: PoolClient,
  data: z.infer<typeof createDonationSchema>,
): Promise<string> {
  const result = await client.query(
    `INSERT INTO donations (donor_id, amount, is_amount_split, tax_deductible_amount, tax_non_deductible_amount, currency, payment_method, message, anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
    [
      data.donor_id,
      data.amount,
      data.is_amount_split ?? false,
      data.tax_deductible_amount ?? 0,
      data.tax_non_deductible_amount ?? 0,
      data.currency,
      data.payment_method,
      data.message ?? null,
      data.anonymous ?? false,
    ],
  );
  return result.rows[0];
}
