export const ORG_DETAILS = {
  name: "PKC FRIENDS INCORPORATED",
  abn: "16 536 715 946",
  address: "11 East Gateway, Wyndham Vale, VIC 3024",
} as const;

export function formatReceiptNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(4, "0");
  return `REC-${year}-${padded}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getDescriptionOfGift(paymentMethod: "cash" | "eft"): string {
  return paymentMethod === "cash" ? "Cash / Money" : "Electronic Funds Transfer (EFT)";
}

export function buildReceiptHtml(params: {
  receiptNumber: string;
  dateOfIssue: string;
  donorName: string;
  donationDate: string;
  amount: string;
  taxDeductible: boolean;
  descriptionOfGift: string;
}): string {
  const {
    receiptNumber,
    dateOfIssue,
    donorName,
    donationDate,
    amount,
    taxDeductible,
    descriptionOfGift,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DGR Donation Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">DGR Donation Receipt</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Tax Deductible Gift Recipient</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Receipt Number</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${receiptNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 20px; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Date of Issue</p>
                    <p style="margin: 0; font-size: 16px; color: #1f2937;">${dateOfIssue}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Organization Details</p>
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #1f2937;">${ORG_DETAILS.name}</p>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #4b5563;">ABN: ${ORG_DETAILS.abn}</p>
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">${ORG_DETAILS.address}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Donor Information</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${donorName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; background: #f9fafb; margin: 0 -32px; padding-left: 32px; padding-right: 32px; margin-left: -32px; margin-right: -32px;">
                    <p style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Donation Details</p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;"><strong>Date of Donation:</strong> ${donationDate}</p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;"><strong>Donation Amount:</strong> $${amount} AUD</p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">
                      ${taxDeductible ? "• Tax Deductible" : "• Non Tax Deductible"}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Description of Gift:</strong> ${descriptionOfGift}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Thank you for your generous support. This receipt is issued for your records. Please retain it for tax purposes if your donation is tax deductible.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">${ORG_DETAILS.name} • ABN ${ORG_DETAILS.abn}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
