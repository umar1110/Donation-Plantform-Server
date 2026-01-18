import { Request, Response } from "express";
import { createTenantSchema } from "./tenant.schema";
import { createTenant } from "./tenant.repository";

export async function registerNewTenant(req: Request, res: Response) {
  const result = createTenantSchema.parse(req.body);

  const tenant = await createTenant(result);

  return res.status(201).json({
    success: true,
    message: "Tenant registered successfully",
    data: tenant,
  });
}
