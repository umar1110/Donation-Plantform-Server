"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
function errorHandler(err, req, res, next) {
    // Log error
    logger_1.default.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        // Return the exact message of the first error for clarity
        const firstIssue = err.issues[0];
        return res.status(400).json({
            success: false,
            errors: err.issues,
            message: firstIssue?.message || 'Validation error'
        });
    }
    // Handle ApiError (operational errors)
    if (err instanceof apiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors.length > 0 && { errors: err.errors })
        });
    }
    // Handle unknown errors
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
}
// Not found handler
function notFoundHandler(req, res) {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
}
