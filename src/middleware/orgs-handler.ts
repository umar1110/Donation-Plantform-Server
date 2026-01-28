import { NextFunction, Request, Response } from "express";
import { OrgsService } from "../modules/orgs/orgs.service";
import { pool } from "../config/database";

export const orgsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();

  try {
    const orgsId = req.headers["x-orgs-id"] as string;
    if (!orgsId) {
      return res.status(400).json({
        success: false,
        message: "Missing X-Orgs-ID header",
      });
    }

    const orgsService = new OrgsService();
    const orgsInfo = await orgsService.getOrgsInfo(orgsId);
    if (!orgsInfo) {
      return res.status(404).json({
        success: false,
        message: "Orgs not found",
      });
    }

    (req as any).orgs = orgsInfo;
    // Setting search path to that schema

    await client.query("BEGIN");
    await client.query(`SET search_path TO ${orgsInfo.schema_name}, public`);
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
