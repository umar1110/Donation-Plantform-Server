import { NextFunction, Request, Response } from "express";
import { OrgsService } from "../modules/orgs/orgs.service";
import { pool } from "../config/database";

export const orgsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  try {
    const orgId = req.headers["x-orgs-id"] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Missing X-Orgs-ID header",
      });
    }

    const orgService = new OrgsService();
    const orgInfo = await orgService.getOrgInfo(orgId);
    if (!orgInfo) {
      return res.status(404).json({
        success: false,
        message: "Org not found",
      });
    }

    (req as any).org = orgInfo;
    // Setting search path to that schema

    next();
  } catch (error) {
    next(error);
  }
};
