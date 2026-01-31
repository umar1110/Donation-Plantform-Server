"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orgs_controller_1 = require("./orgs.controller");
router.post('/orgs', orgs_controller_1.registerNewOrgs);
exports.default = router;
