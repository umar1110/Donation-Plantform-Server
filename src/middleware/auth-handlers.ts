import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { ApiError } from "../utils/apiError";
import { selectUserByAuthId } from "../modules/users/users_respository";
import { IUser } from "../modules/users/user_types";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
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

    // Get schema name from user metadata
    const schemaName = (data.user.user_metadata as any)?.schemaName;
    if (!schemaName) {
      throw new ApiError(401, "User does not belong to any organization");
    }

    // Fetch user profile from org schema
    const user = await selectUserByAuthId(schemaName, data.user.id);

    if (!user) {
      throw new ApiError(404, "User profile not found in organization");
    }

    // Attach user and schema info to request object
    req.user = user as IUser;
    req.schemaName = schemaName;
    req.orgsId = data.user.user_metadata.orgsId;

    next();
  } catch (err) {
    next(err);
  }
}

export async function requireOrgAdmin(
  req: Request,
  res: Response,
  next: NextFunction
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