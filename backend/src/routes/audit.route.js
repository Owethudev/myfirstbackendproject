import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import authorize from "../middleware/authorize.middleware.js";

const router = Router();

// Admin-only endpoint for retrieving audit logs.
router.get("/", authorize("admin"), getAuditLogs);

export default router;
