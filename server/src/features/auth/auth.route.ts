import { Router } from "express";
import { validate } from "@/middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "@/features/auth/auth.schema.js";
import { register, logout, login } from "@/features/auth/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

export default router;
