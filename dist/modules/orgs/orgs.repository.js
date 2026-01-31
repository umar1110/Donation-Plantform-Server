"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgsRepository = void 0;
const database_1 = require("../../config/database");
class OrgsRepository {
    // Get a database client for transaction management
    async getClient() {
        return database_1.pool.connect();
    }
    // Create orgs record in public schema
    async insertOrgs(client, data) {
        const result = await client.query(`INSERT INTO public.orgs (name, subdomain, description, website, abn, type, country, state_province, city, address, receipt_prefix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`, [
            data.name,
            data.subdomain,
            data.description,
            data.website,
            data.ABN,
            data.type,
            data.country,
            data.state_province,
            data.city,
            data.address,
            data.receipt_prefix,
        ]);
        return result.rows[0].id;
    }
    // Insert user profile into organization schema
    async insertUserProfile(client, organizationId, authUserId, firstName, lastName, email) {
        const result = await client.query(`INSERT INTO user_profiles
       (auth_user_id, first_name, last_name, email ,org_id, is_organization_admin)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`, [authUserId, firstName, lastName, email, organizationId]);
        console.log("Inserted user profile result:", result);
        return result.rows[0];
    }
    // Update organization with owner info and activate
    async updateOrgsStatus(client, orgsId, ownerId, ownerEmail) {
        await client.query(`UPDATE public.orgs
       SET owner_id = $1,
           owner_email = $2,
           status = 'active'
       WHERE id = $3`, [ownerId, ownerEmail, orgsId]);
    }
    // Select organization by ID
    async selectOrgsById(orgsId) {
        const result = await database_1.pool.query("SELECT * FROM public.orgs WHERE id = $1", [
            orgsId,
        ]);
        return result.rows[0];
    }
    // Select organization by ID (with client for use in transactions)
    async selectOrgsByIdWithClient(orgsId, client) {
        const result = await client.query("SELECT * FROM public.orgs WHERE id = $1", [orgsId]);
        return result.rows[0];
    }
    /**
     * Atomically get and increment receipt sequence for an org.
     * Resets sequence to 1 when year changes.
     * Must be called within a transaction (client required).
     */
    async getAndIncrementReceiptSequence(orgId, client) {
        const result = await client.query(`UPDATE public.orgs
       SET receipt_sequence = CASE
         WHEN COALESCE(receipt_sequence_year, 0) < EXTRACT(YEAR FROM NOW())::INT THEN 1
         ELSE COALESCE(receipt_sequence, 0) + 1
       END,
       receipt_sequence_year = EXTRACT(YEAR FROM NOW())::INT
       WHERE id = $1
       RETURNING receipt_prefix, receipt_sequence, receipt_sequence_year`, [orgId]);
        if (!result.rows[0]) {
            throw new Error("Org not found for receipt sequence");
        }
        const row = result.rows[0];
        return {
            prefix: row.receipt_prefix,
            sequence: row.receipt_sequence,
            year: row.receipt_sequence_year,
        };
    }
}
exports.OrgsRepository = OrgsRepository;
