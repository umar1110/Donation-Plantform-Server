import { z } from "zod";

export const receiptDonationItemSchema = z.object({
  donorName: z.string().min(1, "Donor name is required"),
  donorEmail: z.string().email("Valid donor email is required"),
  amount: z.number().positive("Amount must be positive"),
  donationDate: z.string().min(1, "Donation date is required"),
  paymentMethod: z.enum(["cash", "eft"]),
  taxDeductible: z.boolean(),
});

export const createReceiptsSchema = z.object({
  donations: z.array(receiptDonationItemSchema).min(1, "At least one donation is required"),
});

export type ReceiptDonationItem = z.infer<typeof receiptDonationItemSchema>;
export type CreateReceiptsPayload = z.infer<typeof createReceiptsSchema>;
