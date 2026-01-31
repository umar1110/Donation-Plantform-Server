import { z } from "zod";
import { createDonorSchema } from "./donors_schema";

export type IDonor = z.infer<typeof createDonorSchema> & {
  id: string;
  auth_user_id: string | null;
  created_at: Date;
  updated_at: Date;
};
