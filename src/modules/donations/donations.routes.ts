import express from "express";
import { addNewDonationController } from "./donations_controller";

const router = express.Router();

router.post("/donations", addNewDonationController);

export default router;
