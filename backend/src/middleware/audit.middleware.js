import { AuditLog } from "../models/auditlog.model.js";

const isSensitiveField = (field) => {
    const normalizedField = field.toLowerCase().replace(/[-_]/g, "");
    return normalizedField.includes("token") || normalizedField.includes("password");
};

const sanitizeObject = (value) => {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeObject(item));
    }
    if (typeof value === "object") {
        return Object.entries(value).reduce((result, [key, entryValue]) => {
            if (isSensitiveField(key)) {
                result[key] = "[REDACTED]";
            } else {
                result[key] = sanitizeObject(entryValue);
            }
            return result;
        }, {});
    }
    return value;
};

const sanitizeAuditPath = (requestUrl) => {
    const url = String(requestUrl || "");
    const hashIndex = url.indexOf("#");
    const fragment = hashIndex === -1 ? "" : url.slice(hashIndex);
    const urlWithoutFragment = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const queryIndex = urlWithoutFragment.indexOf("?");
    const pathname =
        queryIndex === -1
            ? urlWithoutFragment
            : urlWithoutFragment.slice(0, queryIndex);
    const query =
        queryIndex === -1 ? "" : urlWithoutFragment.slice(queryIndex + 1);
    const safePathname = pathname.replace(
        /(\/api\/v1\/users\/verify\/)[^/?#]+/i,
        "$1[REDACTED]",
    );

    if (!query) {
        return `${safePathname}${fragment}`;
    }

    const searchParams = new URLSearchParams(query);
    for (const key of searchParams.keys()) {
        if (isSensitiveField(key)) {
            searchParams.set(key, "[REDACTED]");
        }
    }

    const safeQuery = searchParams.toString();
    return `${safePathname}${safeQuery ? `?${safeQuery}` : ""}${fragment}`;
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
        path: sanitizeAuditPath(req.originalUrl || req.url),
        query: sanitizeObject(req.query || {}),
        params: sanitizeObject(req.params || {}),
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

export { sanitizeAuditPath, sanitizeObject };
export default auditMiddleware;
