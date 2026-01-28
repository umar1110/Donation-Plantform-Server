import { PoolClient } from "pg";
import { pool } from "../../config/database";
import { IUser } from "./user_types";

/**
 * Select user by auth_user_id from organization schema
 */
export const selectUserByAuthId = async (
  schemaName: string,
  authUserId: string
): Promise<IUser | null> => {
  const result = await pool.query(
    `SELECT * FROM ${schemaName}.user_profiles WHERE auth_user_id = $1`,
    [authUserId]
  );
  return result.rows[0] || null;
};

/**
 * Select user by ID from current schema (requires search_path to be set)
 */
export const selectUserById = async (
  client: PoolClient,
  userId: string
): Promise<IUser | null> => {
  const result = await client.query(
    `SELECT * FROM user_profiles WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Select user by email from current schema
 */
export const selectUserByEmail = async (
  client: PoolClient,
  email: string
): Promise<IUser | null> => {
  const result = await client.query(
    `SELECT * FROM user_profiles WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Select all users from current schema
 */
export const selectAllUsers = async (client: PoolClient): Promise<IUser[]> => {
  const result = await client.query(`SELECT * FROM user_profiles ORDER BY created_at DESC`);
  return result.rows;
};

/**
 * Insert a new user profile
 */
export const insertUserProfile = async (
  client: PoolClient,
  schemaName: string,
  data: {
    authUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    isOrganizationAdmin?: boolean;
    isSuperAdmin?: boolean;
  }
): Promise<IUser> => {
  const result = await client.query(
    `INSERT INTO ${schemaName}.user_profiles 
     (auth_user_id, first_name, last_name, email, is_organization_admin, is_super_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.authUserId,
      data.firstName,
      data.lastName,
      data.email,
      data.isOrganizationAdmin || false,
      data.isSuperAdmin || false,
    ]
  );
  return result.rows[0];
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  client: PoolClient,
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    isOrganizationAdmin?: boolean;
  }
): Promise<IUser | null> => {
  const fields: string[] = [];
  const values: any[] = [];
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
    return selectUserById(client, userId);
  }

  values.push(userId);
  const result = await client.query(
    `UPDATE user_profiles SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

/**
 * Delete user profile
 */
export const deleteUserProfile = async (
  client: PoolClient,
  userId: string
): Promise<IUser | null> => {
  const result = await client.query(
    `DELETE FROM user_profiles WHERE id = $1 RETURNING *`,
    [userId]
  );
  return result.rows[0] || null;
};
