import express from "express";
import httpLogger from "./middleware/httpLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// Routes
import orgsRoutes from "./modules/orgs/orgs.routes";
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});
app.use("/api/v1", orgsRoutes);

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
