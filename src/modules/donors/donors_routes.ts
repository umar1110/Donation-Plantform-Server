import express from "express";
import { searchDonorsController } from "./donors_controller";
import { orgsHandler } from "../../middleware/orgs-handler";
import { asyncHandler } from "../../utils/catchAsyncErrors";

const router = express.Router();

// Search donors by email, first_name, or last_name
router.get("/donors/search", orgsHandler, asyncHandler(searchDonorsController));

export default router;
