import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createCheck } from "./check.controller.js";
const router = Router();
router.use(requireAuth);
router.post("/monitors/:monitorId/checks", createCheck);
export default router;
//# sourceMappingURL=check.route.js.map