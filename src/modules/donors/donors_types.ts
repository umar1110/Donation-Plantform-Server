import { z } from "zod";
import { createDonorSchema } from "./donors_schema";

export type IDonorProfile = z.infer<typeof createDonorSchema> & {
  id: string;
  auth_user_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type IDonorCreate = Omit<
  IDonorProfile,
  "id" | "created_at" | "updated_at"
>;
