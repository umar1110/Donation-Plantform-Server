import express from "express";
import { tenantHandler } from "../../middleware/tenant-handler";
import { ApiError } from "../../utils/apiError";

const router = express.Router();

// Authenticate User: Can be added here in future
router.get("/test", tenantHandler, (req, res) => {
  throw new ApiError(400, "Test error from test route", []);
  res.json({ message: "Test route is working with tenant checking!" });
});

export default router;
