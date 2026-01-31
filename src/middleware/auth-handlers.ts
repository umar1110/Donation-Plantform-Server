import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { ApiError } from "../utils/apiError";
import { selectUserByAuthId } from "../modules/users/users_respository";
import { IUser } from "../modules/users/user_types";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Login required to access this resource");
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new ApiError(401, "Invalid or expired access token");
    }

    // Fetch user profile from org schema
    const user = await selectUserByAuthId(data.user.id);

    if (!user) {
      throw new ApiError(404, "User profile not found in organization");
    }

    // Attach user and schema info to request object
    req.user = user as IUser;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireOrgAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!req.user.is_organization_admin) {
      throw new ApiError(403, "Organization admin access required");
    }

    next();
  } catch (err) {
    next(err);
  }
}
