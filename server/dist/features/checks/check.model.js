import mongoose, { Schema } from "mongoose";
const checkSchema = new Schema({
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
    responseTimeMs: {
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
const Check = mongoose.model("CheckResult", checkSchema);
export default Check;
//# sourceMappingURL=check.model.js.map