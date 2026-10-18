import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRouter from "@/features/auth/auth.route.js";
import monitorRouter from "@/features/monitors/monitor.route.js";
import checkRouter from "@/features/checks/check.route.js";
import { errorHandler } from "@/middleware/error.middleware.js";

export const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/monitors", monitorRouter);
app.use("/api", checkRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);
