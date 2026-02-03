import express from "express";
import "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import httpLogger from "./middleware/httpLogger";
const app = express();

// Cors
import cors from "cors";
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    allowedHeaders: ["Content-Type", "Authorization", "X-Orgs-ID"],
  }),
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// Routes
import orgsRoutes from "./modules/orgs/orgs.routes";
import authRoutes from "./modules/auth/auth_routes";
import usersRoutes from "./modules/users/users_routes";
import donationsRoutes from "./modules/donations/donations.routes";
import donorsRoutes from "./modules/donors/donors_routes";
import receiptsRoutes from "./modules/receipts/receipts_routes";
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});
app.use("/api/v1", orgsRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", usersRoutes);
app.use("/api/v1", donationsRoutes);
app.use("/api/v1", donorsRoutes);
app.use("/api/v1", receiptsRoutes);

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
