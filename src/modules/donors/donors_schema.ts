import { z } from "zod";

export const createDonorSchema = z.object({
    first_name: z.string("First Name is required."),
    last_name: z.string("Last Name is required."),
    email: z.string("Email is required.").email("Invalid email address."),
    phone: z.string().optional(),
    address: z.string().optional(),
    auth_user_id: z.string().uuid().optional().nullable(),
})

