import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createMonitorSchema, partialUpdateMonitorSchema, } from "./monitor.schema.js";
import { createMonitor, getMonitors, getMonitorById, partialUpdateMonitor, deleteMonitor, analyticsMonitor, } from "./monitor.controller.js";
const router = Router();
router.use(requireAuth);
router.post("/", validate(createMonitorSchema), createMonitor);
router.get("/", getMonitors);
router
    .route("/:id")
    .get(getMonitorById)
    .patch(validate(partialUpdateMonitorSchema), partialUpdateMonitor)
    .delete(deleteMonitor);
router.get("/:id/analytics", analyticsMonitor);
export default router;
//# sourceMappingURL=monitor.route.js.map