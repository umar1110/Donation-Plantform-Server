"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextReceiptNumber = getNextReceiptNumber;
exports.insertReceipt = insertReceipt;
const database_1 = require("../../config/database");
const orgs_repository_1 = require("../orgs/orgs.repository");
function queryClient(client) {
    return client ?? database_1.pool;
}
const orgsRepository = new orgs_repository_1.OrgsRepository();
/**
 * Atomically get the next receipt number for an org.
 * Uses row lock on org to prevent duplicate receipt numbers under concurrency.
 */
async function getNextReceiptNumber(orgId, client) {
    const { prefix, sequence, year } = await orgsRepository.getAndIncrementReceiptSequence(orgId, client);
    const paddedSeq = String(sequence).padStart(5, "0");
    return `${prefix}-${year}-${paddedSeq}`;
}
/**
 * Insert a receipt record.
 */
async function insertReceipt(data, client) {
    const q = queryClient(client);
    const result = await q.query(`INSERT INTO receipts (
      org_id, donation_id, receipt_number,
      donor_name, donor_email, amount, currency,
      is_amount_split, tax_deductible_amount, tax_non_deductible_amount,
      donation_date, org_name, org_abn, org_address,
      retention_until, issued_by_admin_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id`, [
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
    ]);
    return { id: result.rows[0].id };
}
