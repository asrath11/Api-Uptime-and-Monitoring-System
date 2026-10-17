import { Router } from "express";

import { validate } from "@/middleware/validate.middleware.js";
import { requireAuth } from "@/middleware/auth.middleware.js";

import {
  createMonitorSchema,
  partialUpdateMonitorSchema,
} from "@/features/monitors/monitor.schema.js";

import {
  createMonitor,
  getMonitors,
  getMonitorById,
  partialUpdateMonitor,
  deleteMonitor,
} from "@/features/monitors/monitor.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createMonitorSchema), createMonitor);
router.get("/", getMonitors);

router
  .route("/:id")
  .get(getMonitorById)
  .patch(validate(partialUpdateMonitorSchema), partialUpdateMonitor)
  .delete(deleteMonitor);

export default router;
