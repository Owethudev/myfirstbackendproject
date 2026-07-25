import { AuditLog } from "../models/auditlog.model.js";

const sensitiveFields = [
    "password",
    "currentPassword",
    "newPassword",
    "token",
    "resetPasswordToken",
    "verificationToken",
];

const sanitizeObject = (value) => {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeObject(item));
    }
    if (typeof value === "object") {
        return Object.entries(value).reduce((result, [key, entryValue]) => {
            if (sensitiveFields.includes(key)) {
                result[key] = "[REDACTED]";
            } else {
                result[key] = sanitizeObject(entryValue);
            }
            return result;
        }, {});
    }
    return value;
};

const auditMiddleware = (req, res, next) => {
    if (req.path.startsWith("/api/v1/audit")) {
        return next();
    }

    const startTime = Date.now();
    const user = req.user || {};

    const auditRecord = new AuditLog({
        userId: user.id || null,
        username: user.username || null,
        email: user.email || null,
        role: user.role || "guest",
        method: req.method,
        path: req.originalUrl || req.url,
        query: req.query || {},
        params: req.params || {},
        body: sanitizeObject(req.body || {}),
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null,
    });

    res.on("finish", async () => {
        try {
            auditRecord.statusCode = res.statusCode;
            auditRecord.durationMs = Date.now() - startTime;
            await auditRecord.save();
        } catch (error) {
            console.error("Failed to save audit log:", error);
        }
    });

    next();
};

export default auditMiddleware;
