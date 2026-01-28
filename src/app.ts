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
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});
app.use("/api/v1", orgsRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", usersRoutes);

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
