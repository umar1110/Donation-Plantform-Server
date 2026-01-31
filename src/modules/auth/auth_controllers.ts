import { Request, Response } from "express";
import { signInSchema } from "./auth_schema";
import { supabase } from "../../config/supabase";
import { selectUserByAuthId } from "../users/users_respository";
import { ApiError } from "../../utils/apiError";

/**
 * Sign in user with email and password
 */
export const signInUser = async (req: Request, res: Response) => {
  const result = signInSchema.parse(req.body);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.email,
    password: result.password,
  });

  if (error || !data.user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
      errors: [error?.message],
    });
  }
  
  // Get user profile
  const userProfile = await selectUserByAuthId(data.user.id);

  if (!userProfile) {
    return res.status(404).json({
      success: false,
      message: "User profile not found in organization",
    });
  }

  return res.status(200).json({
    success: true,
    message: "User signed in successfully",
    data: {
      user: userProfile,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresIn: data.session?.expires_in,
    },
  });
};

/**
 * Refresh access token
 */
export async function refreshToken(req: Request, res: Response) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new ApiError(400, "Refresh token is required");
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  });

  if (error || !data.session) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    },
  });
}
