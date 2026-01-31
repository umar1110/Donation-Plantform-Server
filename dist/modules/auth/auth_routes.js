"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controllers_1 = require("./auth_controllers");
const users_controller_1 = require("../users/users_controller");
const auth_handlers_1 = require("../../middleware/auth-handlers");
const router = express_1.default.Router();
router.post("/auth/login", auth_controllers_1.signInUser);
router.get("/auth/me", auth_handlers_1.requireAuth, users_controller_1.getMeController);
router.post("/auth/refresh-token", auth_controllers_1.refreshToken);
// TODO: Implement proper logout with token blacklisting if necessary
router.post("/auth/logout", auth_handlers_1.requireAuth, (req, res) => {
    // For now, just respond with success. Token invalidation can be handled client-side or with short-lived tokens.
    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});
exports.default = router;
