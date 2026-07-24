import { Router } from "express";
import { forgotPassword, resetPassword } from "../controllers/auth.controller.js";

const router = Router();

// Forgot-password request is intentionally generic to avoid account enumeration.
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
