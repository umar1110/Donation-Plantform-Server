import express from "express";
import { refreshToken, signInUser } from "./auth_controllers";
import { getMeController } from "../users/users_controller";
import { requireAuth } from "../../middleware/auth-handlers";

const router = express.Router();

router.post("/auth/login", signInUser);
router.get("/auth/me", requireAuth, getMeController);
router.post("/auth/refresh-token", refreshToken);
// TODO: Implement proper logout with token blacklisting if necessary
router.post(
  "/auth/logout",
  requireAuth,
  (req: express.Request, res: express.Response) => {
    // For now, just respond with success. Token invalidation can be handled client-side or with short-lived tokens.
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

export default router;
