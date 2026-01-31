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
import { pool } from "../../config/database";

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return selectUserById(userId);
  }

  /**
   * Get all users in the organization
   */
  async getAllUsers(): Promise<IUser[]> {
    return selectAllUsers();
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    userData: z.infer<typeof updateUserSchema>,
  ): Promise<IUser | null> {
    const existingUser = await selectUserById(userId);
    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    return updateUserProfile(userId, {
      firstName: userData.first_name,
      lastName: userData.last_name,
      isOrganizationAdmin: userData.is_organization_admin,
    });
  }
}
