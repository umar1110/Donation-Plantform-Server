import nodemailer from "nodemailer";
import { config } from "../../config/env";
import { IReceiptCreate } from "./receipts_types";

interface IReceiptEmailData extends IReceiptCreate {
  description_of_gift?: string;
}

export const sendDonationReceiptEmail = async (
  receiptData: IReceiptEmailData
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465
    from: config.email.smtpMail,
    auth: {
      user: config.email.smtpMail,
      pass: config.email.smtpPassword,
    },
  });

  const htmlTemplate = generateReceiptHtml(receiptData);
  const textTemplate = generateReceiptText(receiptData);

  const info = await transporter.sendMail({
    from: `"${receiptData.org_name}" <${config.email.smtpMail}>`,
    to: receiptData.donor_email || "",
    subject: `Donation Receipt - ${receiptData.receipt_number}`,
    text: textTemplate,
    html: htmlTemplate,
  });

  console.log("Receipt email sent:", info.messageId);
  return info;
};

function generateReceiptHtml(receipt: IReceiptEmailData): string {
  const donationDate = new Date(receipt.donation_date).toLocaleDateString(
    "en-AU",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );
  const issueDate = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Convert string amounts to numbers (PostgreSQL returns numeric as strings)
  const amount = Number(receipt.amount);
  const taxDeductibleAmount = Number(receipt.tax_deductible_amount);
  const taxNonDeductibleAmount = Number(receipt.tax_non_deductible_amount);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;"> Donation Receipt</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Receipt Number & Date -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Receipt Number</p>
                    <p style="margin: 0; color: #212529; font-size: 18px; font-weight: 600;">${receipt.receipt_number}</p>
                  </td>
                </tr>
               
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date of Issue</p>
                    <p style="margin: 0; color: #212529; font-size: 16px;">${issueDate}</p>
                  </td>
                </tr>
              </table>

              <!-- Organization Details -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Organization Details</h2>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">Organization Name:</strong>
                      <span style="color: #212529; font-size: 14px; margin-left: 8px;">${receipt.org_name}</span>
                    </td>
                  </tr>
                  ${
                    receipt.org_abn
                      ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">ABN:</strong>
                      <span style="color: #212529; font-size: 14px; margin-left: 8px;">${receipt.org_abn}</span>
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">Address:</strong>
                      <span style="color: #212529; font-size: 14px; margin-left: 8px;">${receipt.org_address}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Donor Information -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Donor Information</h2>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">Donor Name:</strong>
                      <span style="color: #212529; font-size: 14px; margin-left: 8px;">${receipt.donor_name}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Donation Details -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Donation Details</h2>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">Date of Donation:</strong>
                      <span style="color: #212529; font-size: 14px; margin-left: 8px;">${donationDate}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #495057; font-size: 14px;">Donation Amount:</strong>
                      <span style="color: #212529; font-size: 16px; font-weight: 600; margin-left: 8px;">${receipt.currency} $${amount.toFixed(2)}</span>
                    </td>
                  </tr>
                  ${
                    receipt.is_amount_split
                      ? `
                  <tr>
                    <td style="padding: 15px; background-color: #e7f5ff; border-radius: 6px; margin-top: 10px;">
                      <div style="margin-bottom: 12px;">
                        <span style="display: inline-block; padding: 6px 12px; background-color: #28a745; color: #ffffff; border-radius: 4px; font-size: 13px; font-weight: 600; margin-right: 8px;">✓ Tax Deductible</span>
                        <span style="color: #212529; font-size: 15px; font-weight: 600;">${receipt.currency} $${taxDeductibleAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span style="display: inline-block; padding: 6px 12px; background-color: #6c757d; color: #ffffff; border-radius: 4px; font-size: 13px; font-weight: 600; margin-right: 8px;">Non Tax Deductible</span>
                        <span style="color: #212529; font-size: 15px; font-weight: 600;">${receipt.currency} $${taxNonDeductibleAmount.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                  `
                      : `
                  <tr>
                    <td style="padding: 15px; background-color: #d4edda; border-radius: 6px; margin-top: 10px;">
                      <span style="display: inline-block; padding: 6px 12px; background-color: #28a745; color: #ffffff; border-radius: 4px; font-size: 13px; font-weight: 600;">✓ Tax Deductible</span>
                    </td>
                  </tr>
                  `
                  }
                 
                </table>
              </div>

              <!-- Footer Note -->
              <div style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                  <strong>Important:</strong> Please retain this receipt for your tax records. This receipt is issued in accordance with ATO requirements for tax-deductible donations.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 13px;">Thank you for your generous donation!</p>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; ${new Date().getFullYear()} ${receipt.org_name}. All rights reserved.</p>
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

function generateReceiptText(receipt: IReceiptEmailData): string {
  const donationDate = new Date(receipt.donation_date).toLocaleDateString(
    "en-AU",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );
  const issueDate = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Convert string amounts to numbers (PostgreSQL returns numeric as strings)
  const amount = Number(receipt.amount);
  const taxDeductibleAmount = Number(receipt.tax_deductible_amount);
  const taxNonDeductibleAmount = Number(receipt.tax_non_deductible_amount);

  let taxInfo = "";
  if (receipt.is_amount_split) {
    taxInfo = `
• Tax Deductible: ${receipt.currency} $${taxDeductibleAmount.toFixed(2)}
• Non Tax Deductible: ${receipt.currency} $${taxNonDeductibleAmount.toFixed(2)}`;
  } else {
    taxInfo = "\n• Tax Deductible";
  }

  return `
 DONATION RECEIPT
====================

Receipt Number: ${receipt.receipt_number}
Date of Issue: ${issueDate}

ORGANIZATION DETAILS
--------------------
Organization Name: ${receipt.org_name}
${receipt.org_abn ? `ABN: ${receipt.org_abn}` : ""}
Address: ${receipt.org_address}

DONOR INFORMATION
-----------------
Donor Name: ${receipt.donor_name}

DONATION DETAILS
----------------
Date of Donation: ${donationDate}
Donation Amount: ${receipt.currency} $${amount.toFixed(2)}
${taxInfo}

---
Thank you for your generous donation!

Important: Please retain this receipt for your tax records. This receipt is issued in accordance with ATO requirements for tax-deductible donations.

© ${new Date().getFullYear()} ${receipt.org_name}. All rights reserved.
  `.trim();
}
