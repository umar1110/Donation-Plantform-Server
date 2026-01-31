import { z } from "zod";
import { createDonorSchema } from "../donors/donors_schema";


const createDonationSchema = z
  .object({
   
    amount: z.number("Amount is required").positive("Amount must be positive"),
    is_amount_split: z.boolean().optional().default(false),
    tax_deductible_amount: z
      .number()
      .min(0, "Tax deductible amount cannot be negative")
      .optional()
      .default(0),
    tax_non_deductible_amount: z
      .number()
      .min(0, "Tax non-deductible amount cannot be negative")
      .optional()
      .default(0),
    currency: z
      .string("Currency is required")
      .min(2, "Currency must be at least 2 characters long"),
    payment_method: z
      .string("Payment method is required")
      .min(2, "Payment method must be at least 2 characters long"),
    message: z.string().optional().nullable(),
    anonymous: z.boolean().optional().default(false),

    // If not donorId than donor data
    donor_id: z.string().uuid("Invalid Donor ID").optional(),
    donor: createDonorSchema.optional(),
  })
  .refine(
    (data) => !!data.donor_id || !!data.donor,
    {
      message: "Either donor_id or donor must be provided.",
      path: ["donor_id", "donor"],
    }
  );

export { createDonationSchema };
