"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/logger.ts
const morgan_1 = __importDefault(require("morgan"));
/**
 * Custom Morgan format
 */
morgan_1.default.token("body", (req) => {
    return JSON.stringify(req.body);
});
const devFormat = ":method :url :status :response-time ms - body: :body";
const prodFormat = ":method :url :status :response-time ms";
const httpLogger = process.env.NODE_ENV === "production"
    ? (0, morgan_1.default)(prodFormat)
    : (0, morgan_1.default)(devFormat);
exports.default = httpLogger;
