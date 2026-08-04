import { AuditLog } from "../models/auditlog.model.js";

const findAuditLogs = async ({ query = {}, limit = 100 }) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

  return AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(parsedLimit);
};

export { findAuditLogs };
export default { findAuditLogs };