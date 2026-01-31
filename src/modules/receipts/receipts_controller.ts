import { Request, Response } from "express";
import { createReceiptsSchema } from "./receipts_schema";
import {
  buildAndSendReceipt,
  getNextReceiptNumberForSession,
} from "./receipts_service";
import { sendReceiptEmail } from "./email-sender";

export async function issueReceiptsController(req: Request, res: Response) {
  try {
    const validated = createReceiptsSchema.parse(req.body);

    const results = [];
    for (const item of validated.donations) {
      const receiptNumber = getNextReceiptNumberForSession();
      const result = await buildAndSendReceipt(
        item,
        receiptNumber,
        sendReceiptEmail
      );
      results.push(result);
    }

    return res.status(200).json({
      success: true,
      message: "Receipt(s) issued",
      data: { results },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "errors" in error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: (error as { errors: unknown }).errors,
      });
    }
    const message = error instanceof Error ? error.message : "Failed to issue receipts";
    return res.status(500).json({
      success: false,
      message,
    });
  }
}
