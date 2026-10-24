import Monitor from "./monitor.model.js";
import { asyncWrapper } from "../../utils/asyncWrapper.js";
import mongoose from "mongoose";
import Check from "../checks/check.model.js";
export const createMonitor = asyncWrapper(async (req, res) => {
    const { name, url, method, intervalSeconds, timeoutSeconds, expectedStatusCode, } = req.body;
    const userId = req.user?._id;
    const monitor = await Monitor.create({
        name,
        url,
        method,
        intervalSeconds,
        timeoutSeconds,
        expectedStatusCode,
        userId,
    });
    res.status(201).json({
        success: true,
        data: monitor,
    });
});
export const getMonitors = asyncWrapper(async (req, res) => {
    const userId = req.user?._id;
    const monitors = await Monitor.find({ userId });
    res.status(200).json({
        success: true,
        data: monitors,
    });
});
export const getMonitorById = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user?._id });
    if (!monitor) {
        return res.status(404).json({
            success: false,
            message: "Monitor not found",
        });
    }
    res.status(200).json({
        success: true,
        data: monitor,
    });
});
export const partialUpdateMonitor = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const monitor = await Monitor.findOneAndUpdate({ _id: id, userId: req.user?._id }, { $set: updates }, {
        new: true,
        runValidators: true,
    });
    if (!monitor) {
        res.status(404).json({
            success: false,
            message: "Monitor not found",
        });
        return;
    }
    res.status(200).json({
        success: true,
        data: monitor,
    });
});
export const deleteMonitor = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const monitor = await Monitor.findOneAndDelete({
        _id: id,
        userId: req.user?._id,
    });
    if (!monitor) {
        return res.status(404).json({
            success: false,
            message: "Monitor not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Monitor deleted successfully",
    });
});
export const analyticsMonitor = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const range = req.query.range ?? "24h";
    if (range !== "24h" && range !== "7d" && range !== "30d") {
        return res.status(400).json({
            success: false,
            message: "Range must be one of: 24h, 7d, 30d",
        });
    }
    const match = {
        userId: new mongoose.Types.ObjectId(req.user?._id),
        monitorId: new mongoose.Types.ObjectId(id),
    };
    const now = Date.now();
    const bucketUnit = range === "24h" ? "hour" : "day";
    const bucketCount = range === "24h" ? 24 : range === "7d" ? 7 : 30;
    const bucketMilliseconds = bucketUnit === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const currentBucket = Math.floor(now / bucketMilliseconds) * bucketMilliseconds;
    const since = new Date(currentBucket - (bucketCount - 1) * bucketMilliseconds);
    const rangeMatch = {
        ...match,
        checkedAt: { $gte: since, $lte: new Date(now) },
    };
    const [summary, hourlyTrend, latestResponseChecks] = await Promise.all([
        Check.aggregate([
            { $match: rangeMatch },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTimeMs" },
                    minResponseTime: { $min: "$responseTimeMs" },
                    maxResponseTime: { $max: "$responseTimeMs" },
                    success: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "UP"] }, 1, 0],
                        },
                    },
                    failure: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0],
                        },
                    },
                    rateLimited: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "RATE_LIMITED"] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    status: 1,
                    avgResponseTime: { $floor: "$avgResponseTime" },
                    minResponseTime: 1,
                    maxResponseTime: 1,
                    success: 1,
                    count: 1,
                    failure: 1,
                    rateLimited: 1,
                    rateLimitedCount: "$rateLimited",
                    upTimePercentage: {
                        $cond: [
                            { $gt: [{ $add: ["$success", "$failure"] }, 0] },
                            {
                                $multiply: [
                                    {
                                        $divide: ["$success", { $add: ["$success", "$failure"] }],
                                    },
                                    100,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
        ]),
        Check.aggregate([
            { $match: rangeMatch },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: "$checkedAt",
                            unit: bucketUnit,
                            timezone: "UTC",
                        },
                    },
                    avgResponseTime: { $avg: "$responseTimeMs" },
                    minResponseTime: { $min: "$responseTimeMs" },
                    maxResponseTime: { $max: "$responseTimeMs" },
                    successful: {
                        $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] },
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] },
                    },
                    rateLimited: {
                        $sum: { $cond: [{ $eq: ["$status", "RATE_LIMITED"] }, 1, 0] },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    timestamp: "$_id",
                    avgResponseTime: { $floor: "$avgResponseTime" },
                    minResponseTime: { $floor: "$minResponseTime" },
                    maxResponseTime: { $floor: "$maxResponseTime" },
                    successful: 1,
                    failed: 1,
                    rateLimited: 1,
                    count: 1,
                },
            },
            { $sort: { timestamp: 1 } },
            { $limit: bucketCount },
        ]),
        Check.aggregate([
            { $match: rangeMatch },
            { $sort: { checkedAt: -1 } },
            { $limit: 5000 },
            {
                $project: {
                    _id: 0,
                    timestamp: "$checkedAt",
                    responseMs: "$responseTimeMs",
                },
            },
        ]),
    ]);
    const responseChecks = latestResponseChecks.reverse();
    const responseChecksTruncated = (summary[0]?.count ?? 0) > responseChecks.length;
    res.status(200).json({
        success: true,
        data: {
            monitorId: id,
            analytics: {
                ...(summary[0] || {
                    count: 0,
                    avgResponseTime: 0,
                    success: 0,
                    failure: 0,
                    rateLimited: 0,
                    upTimePercentage: 0,
                }),
                range,
                trend: hourlyTrend,
                responseChecks,
                responseChecksTruncated,
            },
        },
    });
});
//# sourceMappingURL=monitor.controller.js.map