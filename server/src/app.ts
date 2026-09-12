import express from "express";
import morgan from "morgan";

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


