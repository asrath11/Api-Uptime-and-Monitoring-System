import express from "express";
import morgan from "morgan";

import authRouter from "./features/auth/auth.route";
import { errorHandler } from "./middleware/error.middleware";
export const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use('/api/auth', authRouter);

app.use(errorHandler);

