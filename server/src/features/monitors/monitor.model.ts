import mongoose, { Document } from "mongoose";

export interface IMonitor extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  intervalSeconds: number;
  timeoutSeconds: number;
  expectedStatusCode: number;
  currentStatus: "UP" | "DOWN" | "UNKNOWN";
  lastCheckedAt: Date | null;
}

const monitorSchema = new mongoose.Schema<IMonitor>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE"],
      default: "GET",
      required: true,
    },
    intervalSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    timeoutSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    expectedStatusCode: {
      type: Number,
      default: 200,
      min: 100,
      max: 599,
    },
    currentStatus: {
      type: String,
      enum: ["UP", "DOWN", "UNKNOWN"],
      default: "UNKNOWN",
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Monitor = mongoose.model<IMonitor>("Monitor", monitorSchema);

export default Monitor;
