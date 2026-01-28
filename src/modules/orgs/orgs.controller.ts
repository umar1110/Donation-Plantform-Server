import { Request, Response } from "express";
import { createOrgsSchema } from "./orgs.schema";
import { OrgsService } from "./orgs.service";

const orgsService = new OrgsService();

export async function registerNewOrgs(req: Request, res: Response) {
  const result = createOrgsSchema.parse(req.body);

  const orgs = await orgsService.createOrgs(result);

  return res.status(201).json({
    success: true,
    message: "Orgs registered successfully",
    data: orgs,
  });
}
