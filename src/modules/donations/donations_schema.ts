import { z } from "zod";
import { createDonorSchema } from "../donors/donors_schema";
import { DONATION_SOURCE } from "./donations.constants";

const paymentMethodEnum = z.enum([
  "cash",
  "check",
  "bank_transfer",
  "stripe",
  "other",
]);

const statusEnum = z.enum(["pending", "completed", "failed", "refunded"]);
const typeEnum = z.enum(["one-time", "recurring"]);

// Query schema for GET /donations
const getDonationsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Search - donor name or email
  q: z.string().optional(),
  
  // Date range filters
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  
  // Category filters
  type: typeEnum.optional(),
  payment_method: paymentMethodEnum.optional(),
  status: statusEnum.optional(),
  
  // Boolean filters
  anonymous_only: z
    .string()
    .transform((val) => val === "true")
    .optional(),
    
  // Sorting
  sort_by: z.enum(["donation_date", "amount", "created_at"]).default("donation_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

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
    donation_date: z.coerce.date().optional(),
    org_id: z.uuid("Organization ID is required."),
    is_anonymous: z.boolean().optional().default(false),
    note: z.string().optional().nullable(),
    abn: z.string().optional().nullable(),
    donation_by: z.enum(DONATION_SOURCE).default(DONATION_SOURCE.INDIVIDUAL),
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
    },
  )
  .refine(
    (data) => {
      if (!data.is_amount_split) return true;
      const sum =
        (data.tax_deductible_amount ?? 0) +
        (data.tax_non_deductible_amount ?? 0);
      return Math.abs(sum - data.amount) < 0.01;
    },
    {
      message:
        "When amount is split, tax deductible + non deductible must equal amount.",
      path: ["tax_deductible_amount", "tax_non_deductible_amount"],
    },
  );

export { createDonationSchema, getDonationsQuerySchema };
