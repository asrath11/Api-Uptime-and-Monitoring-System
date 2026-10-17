import { Request, Response } from "express";
import {
  CreateMonitorInput,
  PartialUpdateMonitorInput,
} from "./monitor.schema.js";
import Monitor from "./monitor.model.js";
import { asyncWrapper } from "@/utils/asyncWrapper.js";

export const createMonitor = asyncWrapper(
  async (req: Request, res: Response) => {
    const { name, url, method, interval, timeout, expectedStatusCode } =
      req.body as CreateMonitorInput;
    const userId = req.user?._id;
    const monitor = await Monitor.create({
      name,
      url,
      method,
      interval,
      timeout,
      expectedStatusCode,
      userId,
    });
    res.status(201).json({
      success: true,
      data: monitor,
    });
  },
);

export const getMonitors = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const monitors = await Monitor.find({ userId });
  res.status(200).json({
    success: true,
    data: monitors,
  });
});

export const getMonitorById = asyncWrapper(
  async (req: Request, res: Response) => {
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
  },
);

export const partialUpdateMonitor = asyncWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as PartialUpdateMonitorInput;

    const monitor = await Monitor.findOneAndUpdate(
      { _id: id, userId: req.user?._id },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

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
  },
);

export const deleteMonitor = asyncWrapper(
  async (req: Request, res: Response) => {
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
  },
);
