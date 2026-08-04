import { v4 as uuidv4 } from "uuid";
import { parseExpiryToMilliseconds } from "../utils/auth.js";
import {
  createSession as createSessionRepository,
  deleteExpiredSessions,
  findSessionById,
  updateManySessions,
  updateSession,
} from "../repositories/session.repository.js";

const createSession = async ({ userId, userAgent = "", ipAddress = "" }) => {
  const expiresAt = new Date(Date.now() + parseExpiryToMilliseconds(process.env.JWT_ACCESS_TOKEN_EXPIRY || "30m"));
  const sessionId = uuidv4();

  return createSessionRepository({
    userId,
    sessionId,
    userAgent,
    ipAddress,
    expiresAt,
    active: true,
  });
};

const revokeSession = async (sessionId) => {
  if (!sessionId) return null;

  return updateSession({ sessionId }, { active: false, revokedAt: new Date() });
};

const revokeAllUserSessions = async (userId) => {
  if (!userId) return 0;

  const result = await updateManySessions({ userId, active: true }, { active: false, revokedAt: new Date() });

  return result.modifiedCount || 0;
};

const getActiveSession = async (sessionId) => {
  if (!sessionId) return null;

  return findSessionById(sessionId);
};

const cleanupExpiredSessions = async () => {
  await deleteExpiredSessions(new Date());
};

export { createSession, getActiveSession, revokeAllUserSessions, revokeSession, cleanupExpiredSessions };
