"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("./users_controller");
const auth_handlers_1 = require("../../middleware/auth-handlers");
const orgs_handler_1 = require("../../middleware/orgs-handler");
const router = express_1.default.Router();
router.get("/users/me", auth_handlers_1.requireAuth, users_controller_1.getMeController);
router.get("/users", auth_handlers_1.requireAuth, orgs_handler_1.orgsHandler, users_controller_1.getAllUsersController);
router.get("/users/:id", auth_handlers_1.requireAuth, orgs_handler_1.orgsHandler, users_controller_1.getUserController);
exports.default = router;
