import { handleControllerError } from "../utils/controllerResponse.js";
import { getAuditLogs as getAuditLogsService } from "../services/audit.service.js";

const getAuditLogs = async (req, res) => {
    try {
        const result = await getAuditLogsService(req.query);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

export { getAuditLogs };