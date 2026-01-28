import express from "express";
import { refreshToken, signInUser } from "./auth_controllers";
import { getMeController } from "../users/users_controller";
import { requireAuth } from "../../middleware/auth-handlers";

const router = express.Router();

router.post("/auth/login", signInUser);
router.get("/auth/me", requireAuth, getMeController);
router.post("/auth/refresh-token", refreshToken);

export default router;
