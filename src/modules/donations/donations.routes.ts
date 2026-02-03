import express from "express";
import { requireAuth } from "../../middleware/auth-handlers";
import { orgsHandler } from "../../middleware/orgs-handler";
import { addNewDonationController, getDonationsController } from "./donations_controller";

const router = express.Router();

// Get donations with pagination and filters
router.get("/donations", requireAuth, orgsHandler, getDonationsController);

// Create new donation
router.post("/donations", requireAuth, orgsHandler, addNewDonationController);

export default router;
