import mongoose, { Schema, type Document } from "mongoose";

export interface ICheckResult extends Document {
  monitorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "UP" | "DOWN" | "RATE_LIMITED";
  statusCode: number | null;
  responseTime: number;
  error: string | null;
  checkedAt: Date;
}

const checkSchema = new Schema<ICheckResult>({
  monitorId: {
    type: Schema.Types.ObjectId,
    ref: "Monitor",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["UP", "DOWN", "RATE_LIMITED"],
    required: true,
  },
  statusCode: {
    type: Number,
    default: null,
  },
  responseTime: {
    type: Number,
    required: true,
    min: 0,
  },
  error: {
    type: String,
    default: null,
  },
  checkedAt: {
    type: Date,
    default: Date.now,
  },
});

// Efficiently retrieve a monitor's history in time order.
checkSchema.index({ monitorId: 1, checkedAt: -1 });

export const CheckResult = mongoose.model<ICheckResult>(
  "CheckResult",
  checkSchema,
);
