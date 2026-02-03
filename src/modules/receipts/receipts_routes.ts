import express from "express";
import { requireAuth } from "../../middleware/auth-handlers";
import { orgsHandler } from "../../middleware/orgs-handler";
import { getReceiptByDonationController } from "./receipts_controller";
import { sendReceiptEmailController } from "./receipts_controller";

const router = express.Router();

// Get receipt by donation ID
router.get(
  "/receipts/donation/:donationId",
  requireAuth,
  orgsHandler,
  getReceiptByDonationController
);

// Send receipt email
router.post(
  "/receipts/:receiptId/send",
  requireAuth,
  orgsHandler,
  sendReceiptEmailController
);

export default router;
