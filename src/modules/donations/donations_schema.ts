import { z } from "zod";

const createDonationSchema = z.object({
  donor_id: z.string("Donor ID is required").uuid("Invalid Donor ID"),
  orgs_id: z
    .string("Organization ID is required")
    .uuid("Invalid Organization ID"),
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
});

export { createDonationSchema };
