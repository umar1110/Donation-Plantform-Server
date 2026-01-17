import express from "express";

const app = express();


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK" });
});

export default app;