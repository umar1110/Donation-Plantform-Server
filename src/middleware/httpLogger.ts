// src/config/logger.ts
import morgan from "morgan";
import { Request, Response } from "express";

/**
 * Custom Morgan format
 */
morgan.token("body", (req: Request) => {
  return JSON.stringify(req.body);
});

const devFormat =
  ":method :url :status :response-time ms - body: :body";

const prodFormat =
  ":method :url :status :response-time ms";

const httpLogger =
  process.env.NODE_ENV === "production"
    ? morgan(prodFormat)
    : morgan(devFormat);

export default httpLogger;
