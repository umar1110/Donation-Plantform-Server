import { NextFunction, Request, Response } from "express";
import { TenantService } from "../modules/tenants/tenant.service";
import { pool } from "../config/database";

export const tenantHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();

  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Missing X-Tenant-ID header",
      });
    }

    const tenantService = new TenantService();
    const tenantInfo = await tenantService.getTenantInfo(tenantId);
    if (!tenantInfo) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    (req as any).tenant = tenantInfo;
    // Setting search path to that schema

    await client.query("BEGIN");
    await client.query(`SET search_path TO ${tenantInfo.schema_name}, public`);
    (req as any).db = client;
    res.on("finish", async () => {
      await client.query("COMMIT");
      client.release();
    });

    res.on("close", async () => {
      if (!res.writableEnded) {
        await client.query("ROLLBACK");
        client.release();
      }
    });
    next();
  } catch (error) {
    client.query("ROLLBACK");
    client.release();
    next(error);
  }
};
