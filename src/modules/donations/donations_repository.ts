import type { PoolClient } from "pg";
import { pool } from "../../config/database";
import type { IDonation, IDonationCreate } from "./donations_types";

function queryClient(client: PoolClient | undefined) {
  return client ?? pool;
}

export async function insertDonation(
  data: IDonationCreate,
  client?: PoolClient
): Promise<IDonation> {
  const q = queryClient(client);
  const result = await q.query<IDonation>(
    `INSERT INTO donations (donor_id, amount, is_amount_split, tax_deductible_amount, tax_non_deductible_amount, currency, payment_method, message, is_anonymous, org_id, note, donation_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, NOW()))
     RETURNING *`,
    [
      data.donor_id ?? null,
      data.amount,
      data.is_amount_split ?? false,
      data.tax_deductible_amount ?? 0,
      data.tax_non_deductible_amount ?? 0,
      data.currency,
      data.payment_method,
      data.message ?? null,
      data.is_anonymous ?? false,
      data.org_id,
      data.note ?? null,
      data.donation_date ?? null,
    ]
  );
  return result.rows[0];
}
