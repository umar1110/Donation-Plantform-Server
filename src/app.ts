import express from "express";
import httpLogger from "./middleware/httpLogger";
const app = express();


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
// Routes
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});

export default app;