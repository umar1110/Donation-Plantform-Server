import nodemailer from "nodemailer";
import { config } from "../../config/env";
import logger from "../../utils/logger";

function getTransport() {
  const { user, pass } = config.smtp;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendReceiptEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) {
    logger.warn(
      "Receipt email not sent: set SMPT_MAIL and SMPT_PASSWORD in .env"
    );
    return {
      ok: false,
      error:
        "Email not configured. Add SMPT_MAIL and SMPT_PASSWORD to server .env and restart.",
    };
  }

  const from = config.smtp.from ?? config.smtp.user;
  if (!from) {
    return { ok: false, error: "From address not configured." };
  }

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      html,
    });
    logger.info(`Receipt email sent to ${to}, messageId: ${info.messageId}`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to send receipt email to ${to}: ${message}`);
    const friendlyError =
      /BadCredentials|Username and Password not accepted|Invalid credentials/i.test(message)
        ? "SMTP login failed. For Gmail, use an App Password (not your normal password): https://support.google.com/accounts/answer/185833"
        : message;
    return { ok: false, error: friendlyError };
  }
}
