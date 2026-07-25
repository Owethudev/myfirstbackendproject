import { AuditLog } from "../models/auditlog.model.js";

const getAuditLogs = async (req, res) => {
    try {
        const { limit = 100, userId, role, method, path } = req.query;
        const query = {};

        if (userId) query.userId = userId;
        if (role) query.role = role;
        if (method) query.method = method;
        if (path) query.path = path;

        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

        const auditLogs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parsedLimit);

        return res.status(200).json({ success: true, data: auditLogs });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export { getAuditLogs };