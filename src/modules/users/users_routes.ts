import express from "express";
import {
  getMeController,
  getAllUsersController,
  getUserController,
} from "./users_controller";
import { requireAuth, requireOrgAdmin } from "../../middleware/auth-handlers";
import { orgsHandler } from "../../middleware/orgs-handler";

const router = express.Router();

router.get("/users/me", requireAuth, getMeController);
router.get("/users", requireAuth, orgsHandler, getAllUsersController);
router.get("/users/:id", requireAuth, orgsHandler, getUserController);

export default router;
