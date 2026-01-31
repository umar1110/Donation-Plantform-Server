import { PoolClient } from "pg";
import { pool } from "../../config/database";

export class DonationsRepository {
  async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  async insertDonation(
    client: PoolClient,
    data: {
      donor_id: string;
      orgs_id: string;
      amount: number;
      is_amount_split?: boolean;
      tax_deductible_amount?: number;
      tax_non_deductible_amount?: number;
      currency: string;
      payment_method: string;
      message?: string | null;
      anonymous?: boolean;
    }
  ): Promise<string> {
    const result = await client.query(
      `INSERT INTO donations (donor_id, orgs_id, amount, is_amount_split, tax_deductible_amount, tax_non_deductible_amount, currency, payment_method, message, anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        data.donor_id,
        data.orgs_id,
        data.amount,
        data.is_amount_split ?? false,
        data.tax_deductible_amount ?? 0,
        data.tax_non_deductible_amount ?? 0,
        data.currency,
        data.payment_method,
        data.message ?? null,
        data.anonymous ?? false,
      ]
    );
    return result.rows[0].id;
  }
}
