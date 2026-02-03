import type { PoolClient } from "pg";
import { pool } from "../../config/database";
import type { IDonation, IDonationCreate, IDonationsQueryFilters, IDonationWithDonor, IPaginatedDonations } from "./donations_types";

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

/**
 * Get paginated donations with filters
 */
export async function getDonationsByOrg(
  filters: IDonationsQueryFilters,
  client?: PoolClient
): Promise<IPaginatedDonations> {
  const q = queryClient(client);
  
  // Build dynamic WHERE clauses
  const conditions: string[] = ["d.org_id = $1"];
  const params: unknown[] = [filters.org_id];
  let paramIndex = 2;

  // Search by donor name or email
  if (filters.q) {
    const searchPattern = `%${filters.q.toLowerCase()}%`;
    conditions.push(`(
      LOWER(dp.first_name) LIKE $${paramIndex}
      OR LOWER(dp.last_name) LIKE $${paramIndex}
      OR LOWER(dp.email) LIKE $${paramIndex}
      OR LOWER(CONCAT(dp.first_name, ' ', dp.last_name)) LIKE $${paramIndex}
    )`);
    params.push(searchPattern);
    paramIndex++;
  }

  // Date range filters
  if (filters.start_date) {
    conditions.push(`d.donation_date >= $${paramIndex}`);
    params.push(filters.start_date);
    paramIndex++;
  }
  if (filters.end_date) {
    conditions.push(`d.donation_date <= $${paramIndex}`);
    params.push(filters.end_date);
    paramIndex++;
  }

  // Category filters
  if (filters.type) {
    conditions.push(`d.type = $${paramIndex}`);
    params.push(filters.type);
    paramIndex++;
  }
  if (filters.payment_method) {
    conditions.push(`d.payment_method = $${paramIndex}`);
    params.push(filters.payment_method);
    paramIndex++;
  }
  if (filters.status) {
    conditions.push(`d.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  // Anonymous filter
  if (filters.anonymous_only) {
    conditions.push(`d.is_anonymous = true`);
  }

  const whereClause = conditions.join(" AND ");

  // Validate sort column to prevent SQL injection
  const validSortColumns = ["donation_date", "amount", "created_at"];
  const sortBy = validSortColumns.includes(filters.sort_by) ? filters.sort_by : "donation_date";
  const sortOrder = filters.sort_order === "asc" ? "ASC" : "DESC";

  // Count total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM donations d
    LEFT JOIN donor_profiles dp ON d.donor_id = dp.id
    WHERE ${whereClause}
  `;
  const countResult = await q.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Calculate pagination
  const offset = (filters.page - 1) * filters.limit;
  const totalPages = Math.ceil(total / filters.limit);

  // Fetch donations with donor info
  const dataQuery = `
    SELECT 
      d.id,
      d.org_id,
      d.donor_id,
      d.amount,
      d.is_amount_split,
      d.tax_deductible_amount,
      d.tax_non_deductible_amount,
      d.currency,
      d.payment_method,
      d.note,
      d.message,
      d.is_anonymous,
      d.abn,
      d.donation_by,
      d.donation_date,
      d.status,
      d.type,
      d.created_at,
      d.updated_at,
      dp.first_name as donor_first_name,
      dp.last_name as donor_last_name,
      dp.email as donor_email
    FROM donations d
    LEFT JOIN donor_profiles dp ON d.donor_id = dp.id
    WHERE ${whereClause}
    ORDER BY d.${sortBy} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(filters.limit, offset);

  const dataResult = await q.query<IDonationWithDonor>(dataQuery, params);

  return {
    donations: dataResult.rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: totalPages,
      has_next: filters.page < totalPages,
      has_prev: filters.page > 1,
    },
  };
}
