import { PoolClient } from "pg";
import { z } from "zod";
import { updateUserSchema } from "./user_schemas";
import {
  selectUserById,
  selectAllUsers,
  updateUserProfile,
  deleteUserProfile,
} from "./users_respository";
import { ApiError } from "../../utils/apiError";
import { supabaseAdmin } from "../../config/supabase";
import { IUser } from "./user_types";

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string, client: PoolClient): Promise<IUser | null> {
    return selectUserById(client, userId);
  }

  /**
   * Get all users in the organization
   */
  async getAllUsers(client: PoolClient): Promise<IUser[]> {
    return selectAllUsers(client);
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    userData: z.infer<typeof updateUserSchema>,
    client: PoolClient
  ): Promise<IUser | null> {
    const existingUser = await selectUserById(client, userId);
    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    return updateUserProfile(client, userId, {
      firstName: userData.first_name,
      lastName: userData.last_name,
      isOrganizationAdmin: userData.is_organization_admin,
    });
  }

  /**
   * Delete user (profile and auth)
   */
  async deleteUser(
    userId: string,
    requestingUserId: string,
    client: PoolClient
  ): Promise<void> {
    const existingUser = await selectUserById(client, userId);
    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      throw new ApiError(400, "You cannot delete your own account");
    }

    // Prevent deleting organization admins
    if (existingUser.is_organization_admin) {
      throw new ApiError(
        400,
        "Cannot delete organization admin. Transfer admin rights first."
      );
    }

    try {
      await client.query("BEGIN");

      // Delete user profile
      await deleteUserProfile(client, userId);

      // Delete auth user from Supabase
      const { error } = await supabaseAdmin.auth.admin.deleteUser(
        existingUser.auth_user_id
      );
      if (error) {
        throw new ApiError(500, "Failed to delete auth user");
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
}
