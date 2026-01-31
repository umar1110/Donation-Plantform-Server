import { ReceiptDonationItem } from "./receipts_schema";
import {
  buildReceiptHtml,
  formatReceiptNumber,
  formatDate,
  getDescriptionOfGift,
} from "./receipt-template";

export type SendReceiptResult = {
  receiptNumber: string;
  donorEmail: string;
  sent: boolean;
  error?: string;
};

// In-memory sequence for receipt numbers (temp module). In production, use DB.
let receiptSequence = 0;
function getNextReceiptNumber(): string {
  receiptSequence += 1;
  return formatReceiptNumber(receiptSequence);
}

export async function buildAndSendReceipt(
  item: ReceiptDonationItem,
  receiptNumber: string,
  sendEmail: (to: string, subject: string, html: string) => Promise<{ ok: boolean; error?: string }>
): Promise<SendReceiptResult> {
  const dateOfIssue = formatDate(new Date().toISOString());
  const donationDateFormatted = formatDate(item.donationDate);
  const amountFormatted = item.amount.toFixed(2);
  const descriptionOfGift = getDescriptionOfGift(item.paymentMethod);

  const html = buildReceiptHtml({
    receiptNumber,
    dateOfIssue,
    donorName: item.donorName,
    donationDate: donationDateFormatted,
    amount: amountFormatted,
    taxDeductible: item.taxDeductible,
    descriptionOfGift,
  });

  const subject = `Your Donation Receipt ${receiptNumber} – PKC FRIENDS INCORPORATED`;

  const { ok, error } = await sendEmail(item.donorEmail, subject, html);

  return {
    receiptNumber,
    donorEmail: item.donorEmail,
    sent: ok,
    error,
  };
}

export function getNextReceiptNumberForSession(): string {
  return getNextReceiptNumber();
}

export function resetReceiptSequenceForTesting(): void {
  receiptSequence = 0;
}
