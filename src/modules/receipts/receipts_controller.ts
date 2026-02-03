import { Request, Response } from "express";
import { z } from "zod";
import { getReceiptByDonationId } from "./receipts_repository";
import { getReceiptById, markReceiptEmailSent } from "./receipts_repository";
import { sendDonationReceiptEmail } from "./email-sender";
import { ApiError } from "../../utils/apiError";

const getReceiptParamsSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
});

/**
 * Get receipt by donation ID
 * GET /receipts/donation/:donationId
 */
export const getReceiptByDonationController = async (
  req: Request,
  res: Response
) => {
  const orgId = req.org?.id;
  if (!orgId) {
    throw new ApiError(400, "Organization context required");
  }

  const { donationId } = getReceiptParamsSchema.parse(req.params);

  const receipt = await getReceiptByDonationId(donationId, orgId);

  if (!receipt) {
    throw new ApiError(404, "Receipt not found for this donation");
  }

  return res.status(200).json({
    success: true,
    message: "Receipt retrieved successfully",
    data: receipt,
  });
};


const sendReceiptParamsSchema = z.object({
  receiptId: z.string().uuid("Invalid receipt ID"),
});

/**
 * Send receipt email to donor and mark as sent
 * POST /receipts/:receiptId/send
 */
export const sendReceiptEmailController = async (req: Request, res: Response) => {
  const orgId = req.org?.id;
  if (!orgId) {
    throw new ApiError(400, "Organization context required");
  }

  const { receiptId } = sendReceiptParamsSchema.parse(req.params);

  const receipt = await getReceiptById(receiptId, orgId);
  if (!receipt) {
    throw new ApiError(404, "Receipt not found");
  }

  if (!receipt.donor_email) {
    throw new ApiError(400, "No donor email available for this receipt");
  }

  // Prepare data for email sender (IReceiptCreate compatible)
  const emailData = {
    org_id: receipt.org_id,
    donation_id: receipt.donation_id,
    receipt_number: receipt.receipt_number,
    donor_name: receipt.donor_name,
    donor_email: receipt.donor_email,
    amount: receipt.amount,
    currency: receipt.currency,
    is_amount_split: receipt.is_amount_split,
    tax_deductible_amount: receipt.tax_deductible_amount,
    tax_non_deductible_amount: receipt.tax_non_deductible_amount,
    donation_date: receipt.donation_date,
    org_name: receipt.org_name,
    org_abn: receipt.org_abn,
    org_address: receipt.org_address,
    retention_until: receipt.retention_until,
    issued_by_admin_id: receipt.issued_by_admin_id ?? null,
  };

  try {
    await sendDonationReceiptEmail(emailData);
    await markReceiptEmailSent(receiptId);
  } catch (err) {
    console.error("Failed to send receipt email:", err);
    throw new ApiError(500, "Failed to send receipt email");
  }

  const updated = await getReceiptById(receiptId, orgId);

  return res.status(200).json({
    success: true,
    message: "Receipt email sent",
    data: updated,
  });
};
