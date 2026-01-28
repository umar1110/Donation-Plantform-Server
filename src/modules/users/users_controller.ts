import { Request, Response } from "express";
import { PoolClient } from "pg";
import { updateUserSchema } from "./user_schemas";
import { UserService } from "./users_services";

const userService = new UserService();

/**
 * Get current user profile
 */
export const getMeController = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: req.user,
  });
};

/**
 * Get user by ID
 */
export const getUserController = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const client = req.db as PoolClient;

  const user = await userService.getUserById(userId, client);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
};

/**
 * Get all users in organization
 */
export const getAllUsersController = async (req: Request, res: Response) => {
  const client = req.db as PoolClient;

  const users = await userService.getAllUsers(client);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
};

/**
 * Update user
 */
export const updateUserController = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const data = updateUserSchema.parse(req.body);
  const client = req.db as PoolClient;

  const updatedUser = await userService.updateUser(userId, data, client);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
};

/**
 * Delete user
 */
export const deleteUserController = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const requestingUserId = req.user?.id as string;
  const client = req.db as PoolClient;

  await userService.deleteUser(userId, requestingUserId, client);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
};
