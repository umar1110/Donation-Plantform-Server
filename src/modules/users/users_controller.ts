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
  const userId = req.params.id as string;

  const user = await userService.getUserById(userId);

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

  const users = await userService.getAllUsers();

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
};