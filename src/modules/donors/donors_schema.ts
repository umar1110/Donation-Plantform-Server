import { z } from "zod";

export const createDonorSchema = z.object({
  org_id: z.uuid("Organization ID is required."),
  first_name: z.string("First Name is required."),
  last_name: z.string("Last Name is required."),
  email: z.string("Email is required.").email("Invalid email address."),
  phone: z.string().optional(),
  address: z.string().optional(),
  auth_user_id: z.string().uuid().optional().nullable(),
});

export const searchDonorsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});
