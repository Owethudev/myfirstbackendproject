import { createResult } from "../utils/controllerResponse.js";
import { findAuditLogs } from "../repositories/audit.repository.js";

const getAuditLogs = async (query = {}) => {
  const filter = {};
  const { limit = 100, userId, role, method, path } = query;

  if (userId) filter.userId = userId;
  if (role) filter.role = role;
  if (method) filter.method = method;
  if (path) filter.path = path;

  const data = await findAuditLogs({ query: filter, limit });

  return createResult(200, { success: true, data });
};

export { getAuditLogs };
export default { getAuditLogs };