import express from "express";
import { orgsHandler } from "../../middleware/orgs-handler";
import { ApiError } from "../../utils/apiError";

const router = express.Router();

// Authenticate User: Can be added here in future
router.get("/test", orgsHandler, (req, res) => {
  throw new ApiError(400, "Test error from test route", []);
  res.json({ message: "Test route is working with orgs checking!" });
});

export default router;
