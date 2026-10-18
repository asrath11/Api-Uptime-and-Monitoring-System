import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware.js";
import {
  getCheckHistory,
  createCheck,
} from "@/features/checks/check.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/monitors/:monitorId/checks", getCheckHistory);
router.post("/monitors/:monitorId/checks", createCheck);

export default router;
