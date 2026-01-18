import express from "express";
import { tenantHandler } from "../middleware/tenant-handler";

const router = express.Router();

// Authenticate User: Can be added here in future
router.get("/test", tenantHandler, (req, res) => {
  res.json({ message: "Test route is working!" });
});
export default router;
