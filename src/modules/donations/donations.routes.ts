import express from "express";
import { addNewDonationController } from "./donations_controller";
import { orgsHandler } from "../../middleware/orgs-handler";
import { sendDonationReceiptEmail } from "../receipts/email-sender";

const router = express.Router();

// By Admin 
router.post("/donations", orgsHandler, addNewDonationController);

export default router;
