import type { PoolClient } from "pg";
import { pool } from "../../config/database";
import { OrgsRepository } from "../orgs/orgs.repository";
import type { IReceiptCreate } from "./receipts_types";

function queryClient(client: PoolClient | undefined) {
  return client ?? pool;
}

const orgsRepository = new OrgsRepository();

/** Returns next receipt number, e.g. NSW-2025-00001. Must run inside a transaction. */
export async function getNextReceiptNumber(
  orgId: string,
  client: PoolClient
): Promise<string> {
  const { prefix, sequence, year } =
    await orgsRepository.getAndIncrementReceiptSequence(orgId, client);
  const paddedSeq = String(sequence).padStart(5, "0");
  return `${prefix}-${year}-${paddedSeq}`;
}

/** Saves receipt to DB with snapshot of donation/org/donor at time of issue */
export async function insertReceipt(
  data: IReceiptCreate,
  client?: PoolClient
): Promise<{ id: string }> {
  const q = queryClient(client);
  const result = await q.query(
    `INSERT INTO receipts (
      org_id, donation_id, receipt_number,
      donor_name, donor_email, amount, currency,
      is_amount_split, tax_deductible_amount, tax_non_deductible_amount,
      donation_date, org_name, org_abn, org_address,
      retention_until, issued_by_admin_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id`,
    [
      data.org_id,
      data.donation_id,
      data.receipt_number,
      data.donor_name,
      data.donor_email,
      data.amount,
      data.currency,
      data.is_amount_split,
      data.tax_deductible_amount,
      data.tax_non_deductible_amount,
      data.donation_date,
      data.org_name,
      data.org_abn,
      data.org_address,
      data.retention_until,
      data.issued_by_admin_id ?? null,
    ]
  );
  return { id: result.rows[0].id };
}
