"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrgsDonorsTotals = exports.updateDonorTotals = exports.linkDonorToOrg = exports.findDonorByEmailAndOrg = exports.getDonorById = exports.selectDonorById = exports.insertDonorProfile = void 0;
const database_1 = require("../../config/database");
function queryClient(client) {
    return client ?? database_1.pool;
}
const insertDonorProfile = async (data, client) => {
    const { first_name, last_name, email, phone, address, auth_user_id } = data;
    const q = queryClient(client);
    const result = await q.query(`INSERT INTO donor_profiles (first_name, last_name, email, phone, address, auth_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [
        first_name,
        last_name,
        email,
        phone || null,
        address || null,
        auth_user_id || null,
    ]);
    return result.rows[0];
};
exports.insertDonorProfile = insertDonorProfile;
const selectDonorById = async (donorId, client) => {
    const q = queryClient(client);
    const result = await q.query(`SELECT id, first_name, last_name, email, phone, address, auth_user_id, total_donations, donation_count, created_at, updated_at
     FROM donor_profiles
     WHERE id = $1`, [donorId]);
    return result.rows[0];
};
exports.selectDonorById = selectDonorById;
/** Alias for selectDonorById for use in donations service */
exports.getDonorById = exports.selectDonorById;
const findDonorByEmailAndOrg = async (email, orgId, client) => {
    const q = queryClient(client);
    const result = await q.query(`SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.address, d.auth_user_id, d.total_donations, d.donation_count, d.created_at, d.updated_at
     FROM donor_profiles d
     INNER JOIN orgs_donors od ON d.id = od.donor_id
     WHERE d.email = $1 AND od.org_id = $2`, [email, orgId]);
    return result.rows[0];
};
exports.findDonorByEmailAndOrg = findDonorByEmailAndOrg;
const linkDonorToOrg = async (orgId, donorId, client) => {
    const q = queryClient(client);
    await q.query(`INSERT INTO orgs_donors (org_id, donor_id)
     VALUES ($1, $2)`, [orgId, donorId]);
};
exports.linkDonorToOrg = linkDonorToOrg;
const updateDonorTotals = async (donorId, donationAmount, client) => {
    const q = queryClient(client);
    await q.query(`UPDATE donor_profiles
     SET total_donations = COALESCE(total_donations, 0) + $1,
         donation_count = COALESCE(donation_count, 0) + 1,
         updated_at = NOW()
     WHERE id = $2`, [donationAmount, donorId]);
};
exports.updateDonorTotals = updateDonorTotals;
const updateOrgsDonorsTotals = async (orgId, donorId, donationAmount, client) => {
    const q = queryClient(client);
    await q.query(`UPDATE orgs_donors
     SET total_donations = COALESCE(total_donations, 0) + $1,
         donation_count = COALESCE(donation_count, 0) + 1,
         updated_at = NOW()
     WHERE org_id = $2 AND donor_id = $3`, [donationAmount, orgId, donorId]);
};
exports.updateOrgsDonorsTotals = updateOrgsDonorsTotals;
