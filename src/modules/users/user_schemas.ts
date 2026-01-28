import { z } from "zod";

export const updateUserSchema = z.object({
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  is_organization_admin: z.boolean().optional(),
});
