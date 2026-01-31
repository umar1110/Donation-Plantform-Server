"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const donations_controller_1 = require("./donations_controller");
const orgs_handler_1 = require("../../middleware/orgs-handler");
const router = express_1.default.Router();
router.post("/donations", orgs_handler_1.orgsHandler, donations_controller_1.addNewDonationController);
exports.default = router;
