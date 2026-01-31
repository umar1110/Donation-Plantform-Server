import { z } from "zod";
import { createDonorSchema } from "../donors/donors_schema";

const paymentMethodEnum = z.enum([
  "cash",
  "check",
  "bank_transfer",
  "stripe",
  "other",
]);

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
    payment_method: paymentMethodEnum,
    message: z.string().optional().nullable(),
    org_id: z.uuid("Organization ID is required."),
    is_anonymous: z.boolean().optional().default(false),
    donor_id: z.string().uuid("Invalid Donor ID").optional(),
    donor: createDonorSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.is_anonymous) return true;
      return !!data.donor_id || !!data.donor;
    },
    {
      message: "If not anonymous, either donor_id or donor must be provided.",
      path: ["donor_id", "donor"],
    }
  )
  .refine(
    (data) => {
      if (!data.is_amount_split) return true;
      const sum =
        (data.tax_deductible_amount ?? 0) + (data.tax_non_deductible_amount ?? 0);
      return Math.abs(sum - data.amount) < 0.01;
    },
    {
      message:
        "When amount is split, tax deductible + non deductible must equal amount.",
      path: ["tax_deductible_amount", "tax_non_deductible_amount"],
    }
  );

export { createDonationSchema };
