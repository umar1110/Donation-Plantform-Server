import express from "express";
import { issueReceiptsController } from "./receipts_controller";

const router = express.Router();

router.post("/receipts", issueReceiptsController);

export default router;
