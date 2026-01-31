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
    org_id: z.uuid("Organization ID is required."),
    // Can be anonymous donation
    is_anonymous: z.boolean().optional().default(false),
    donor_id: z.string().uuid("Invalid Donor ID").optional(),
    donor: createDonorSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.is_anonymous) {
        // If anonymous, donor_id and donor are both optional
        return true;
      }
      // If not anonymous, require at least one of donor_id or donor
      return !!data.donor_id || !!data.donor;
    },
    {
      message: "If not anonymous, either donor_id or donor must be provided.",
      path: ["donor_id", "donor"],
    }
  );

export { createDonationSchema };
