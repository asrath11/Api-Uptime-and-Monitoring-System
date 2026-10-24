import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { getCurrentUser, register, logout, login, } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
const router = Router();
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);
export default router;
//# sourceMappingURL=auth.route.js.map