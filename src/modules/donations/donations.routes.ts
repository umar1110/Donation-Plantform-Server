import express from "express";
import { addNewDonationController } from "./donations_controller";
import { orgsHandler } from "../../middleware/orgs-handler";

const router = express.Router();

router.post("/donations", orgsHandler, addNewDonationController);

export default router;
