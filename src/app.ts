import express from "express";
import httpLogger from "./middleware/httpLogger";
import testRoutes from "./routes/test.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
const app = express();


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

// Routes
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});
app.use("/",testRoutes)

// Error handling (must be after routes)
app.use(notFoundHandler)
app.use(errorHandler)
export default app;