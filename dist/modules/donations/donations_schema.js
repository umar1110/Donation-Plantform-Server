"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonationSchema = void 0;
const zod_1 = require("zod");
const donors_schema_1 = require("../donors/donors_schema");
const paymentMethodEnum = zod_1.z.enum([
    "cash",
    "check",
    "bank_transfer",
    "stripe",
    "other",
]);
const createDonationSchema = zod_1.z
    .object({
    amount: zod_1.z.number("Amount is required").positive("Amount must be positive"),
    is_amount_split: zod_1.z.boolean().optional().default(false),
    tax_deductible_amount: zod_1.z
        .number()
        .min(0, "Tax deductible amount cannot be negative")
        .optional()
        .default(0),
    tax_non_deductible_amount: zod_1.z
        .number()
        .min(0, "Tax non-deductible amount cannot be negative")
        .optional()
        .default(0),
    currency: zod_1.z
        .string("Currency is required")
        .min(2, "Currency must be at least 2 characters long"),
    payment_method: paymentMethodEnum,
    message: zod_1.z.string().optional().nullable(),
    org_id: zod_1.z.uuid("Organization ID is required."),
    is_anonymous: zod_1.z.boolean().optional().default(false),
    donor_id: zod_1.z.string().uuid("Invalid Donor ID").optional(),
    donor: donors_schema_1.createDonorSchema.optional(),
})
    .refine((data) => {
    if (data.is_anonymous)
        return true;
    return !!data.donor_id || !!data.donor;
}, {
    message: "If not anonymous, either donor_id or donor must be provided.",
    path: ["donor_id", "donor"],
})
    .refine((data) => {
    if (!data.is_amount_split)
        return true;
    const sum = (data.tax_deductible_amount ?? 0) + (data.tax_non_deductible_amount ?? 0);
    return Math.abs(sum - data.amount) < 0.01;
}, {
    message: "When amount is split, tax deductible + non deductible must equal amount.",
    path: ["tax_deductible_amount", "tax_non_deductible_amount"],
});
exports.createDonationSchema = createDonationSchema;
