import { Request, Response } from "express";
import { createTenantSchema } from "./tenant.schema";

export async function registerNewTenant(req: Request, res: Response) {
  const result = createTenantSchema.parse(req.body);

  

  return res.status(201).json({
    success: true,
    message: "Tenant registered successfully",
    data: result,
  });
}
