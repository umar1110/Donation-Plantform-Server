"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserProfile = exports.updateUserProfile = exports.insertUserProfile = exports.selectAllUsers = exports.selectUserByEmail = exports.selectUserById = exports.selectUserByAuthId = void 0;
const database_1 = require("../../config/database");
/**
 * Select user by auth_user_id from organization schema
 */
const selectUserByAuthId = async (authUserId) => {
    const result = await database_1.pool.query(`SELECT * FROM user_profiles WHERE auth_user_id = $1`, [authUserId]);
    return result.rows[0] || null;
};
exports.selectUserByAuthId = selectUserByAuthId;
/**
 * Select user by ID from current schema (requires search_path to be set)
 */
const selectUserById = async (userId) => {
    const result = await database_1.pool.query(`SELECT * FROM user_profiles WHERE id = $1`, [
        userId,
    ]);
    return result.rows[0] || null;
};
exports.selectUserById = selectUserById;
/**
 * Select user by email from current schema
 */
const selectUserByEmail = async (email) => {
    const result = await database_1.pool.query(`SELECT * FROM user_profiles WHERE email = $1`, [email]);
    return result.rows[0] || null;
};
exports.selectUserByEmail = selectUserByEmail;
/**
 * Select all users from current schema
 */
const selectAllUsers = async () => {
    const result = await database_1.pool.query(`SELECT * FROM user_profiles ORDER BY created_at DESC`);
    return result.rows;
};
exports.selectAllUsers = selectAllUsers;
/**
 * Insert a new user profile
 */
const insertUserProfile = async (data) => {
    const result = await database_1.pool.query(`INSERT INTO user_profiles 
     (auth_user_id, first_name, last_name, email, is_organization_admin, is_super_admin, org_id)
     VALUES ($1, $2, $3, $4, $5, $6 , $7)
     RETURNING *`, [
        data.authUserId,
        data.firstName,
        data.lastName,
        data.email,
        data.isOrganizationAdmin || false,
        data.isSuperAdmin || false,
        data.organizationId,
    ]);
    return result.rows[0];
};
exports.insertUserProfile = insertUserProfile;
/**
 * Update user profile
 */
const updateUserProfile = async (userId, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    if (data.firstName !== undefined) {
        fields.push(`first_name = $${paramIndex++}`);
        values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
        fields.push(`last_name = $${paramIndex++}`);
        values.push(data.lastName);
    }
    if (data.isOrganizationAdmin !== undefined) {
        fields.push(`is_organization_admin = $${paramIndex++}`);
        values.push(data.isOrganizationAdmin);
    }
    if (fields.length === 0) {
        return (0, exports.selectUserById)(userId);
    }
    values.push(userId);
    const result = await database_1.pool.query(`UPDATE user_profiles SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`, values);
    return result.rows[0] || null;
};
exports.updateUserProfile = updateUserProfile;
/**
 * Delete user profile
 */
const deleteUserProfile = async (userId) => {
    const result = await database_1.pool.query(`DELETE FROM user_profiles WHERE id = $1 RETURNING *`, [userId]);
    return result.rows[0] || null;
};
exports.deleteUserProfile = deleteUserProfile;
