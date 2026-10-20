import type { Request, Response } from "express";
import mongoose from "mongoose";

import Check from "@/features/checks/check.model.js";
import Monitor from "@/features/monitors/monitor.model.js";
import { performApiCheck } from "@/features/checks/check.service.js";
import { asyncWrapper } from "@/utils/asyncWrapper.js";

export const getCheckHistory = asyncWrapper(
  async (req: Request, res: Response) => {
    const { monitorId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      typeof monitorId !== "string" ||
      !mongoose.Types.ObjectId.isValid(monitorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid monitor ID",
      });
    }

    const monitor = await Monitor.findOne({
      _id: monitorId,
      userId,
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    const parsePositiveInteger = (
      value: unknown,
      defaultValue: number,
    ): number | null => {
      if (value === undefined) return defaultValue;
      if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
      }
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : null;
    };

    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 25);

    if (
      page === null ||
      limit === null ||
      limit > 100 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {
      monitorId: monitor._id,
      userId,
    };
    const [checks, total] = await Promise.all([
      Check.find(filter)
        .sort({ checkedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Check.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: checks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);

export const createCheck = asyncWrapper(async (req: Request, res: Response) => {
  const { monitorId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (
    typeof monitorId !== "string" ||
    !mongoose.Types.ObjectId.isValid(monitorId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid monitor ID",
    });
  }

  const monitor = await Monitor.findOne({
    _id: monitorId,
    userId,
  });

  if (!monitor) {
    return res.status(404).json({
      success: false,
      message: "Monitor not found",
    });
  }

  const outcome = await performApiCheck(monitor);

  const checkedAt = new Date();
  const check = await Check.create({
    monitorId: monitor._id,
    userId,
    ...outcome,
    checkedAt,
  });

  if (outcome.status !== "RATE_LIMITED") {
    monitor.currentStatus = outcome.status;
  }

  monitor.lastCheckedAt = checkedAt;
  await monitor.save();

  return res.status(201).json({
    success: true,
    data: check,
  });
});
