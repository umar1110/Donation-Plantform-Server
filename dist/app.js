"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const httpLogger_1 = __importDefault(require("./middleware/httpLogger"));
const app = (0, express_1.default)();
// Cors
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(httpLogger_1.default);
// Routes
const orgs_routes_1 = __importDefault(require("./modules/orgs/orgs.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth_routes"));
const users_routes_1 = __importDefault(require("./modules/users/users_routes"));
const donations_routes_1 = __importDefault(require("./modules/donations/donations.routes"));
app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
app.use("/api/v1", orgs_routes_1.default);
app.use("/api/v1", auth_routes_1.default);
app.use("/api/v1", users_routes_1.default);
app.use("/api/v1", donations_routes_1.default);
// Error handling (must be after routes)
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
