import mongoose from "mongoose";
const monitorSchema = new mongoose.Schema({
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
    isPaused: {
        type: Boolean,
        default: false,
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
}, {
    timestamps: true,
});
const Monitor = mongoose.model("Monitor", monitorSchema);
export default Monitor;
//# sourceMappingURL=monitor.model.js.map