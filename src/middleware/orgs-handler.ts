import { NextFunction, Request, Response } from "express";
import { OrgsService } from "../modules/orgs/orgs.service";

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

    req.org = orgInfo;

    next();
  } catch (error) {
    next(error);
  }
};
