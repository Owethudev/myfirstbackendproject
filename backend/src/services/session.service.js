import { v4 as uuidv4 } from "uuid";
import { parseExpiryToMilliseconds } from "../utils/auth.js";
import {
  createSession as createSessionRepository,
  deleteExpiredSessions,
  findSessionById,
  updateManySessions,
  updateSession,
} from "../repositories/session.repository.js";

const createSession = async ({ userId }) => {
  const expiresAt = new Date(Date.now() + parseExpiryToMilliseconds(process.env.JWT_ACCESS_TOKEN_EXPIRY || "30m"));
  const sessionId = uuidv4();

  return createSessionRepository({
    userId,
    sessionId,
    expiresAt,
    active: true,
  });
};

const buildSessionRevocationFilter = (userId, sessionId) => {
  if (!userId) return null;

  return sessionId
    ? { sessionId, userId, active: true }
    : { userId, active: true };
};

const revokeSession = async (sessionId, userId) => {
  if (!sessionId || !userId) return null;

  return updateSession(
    buildSessionRevocationFilter(userId, sessionId),
    { active: false, revokedAt: new Date() },
  );
};

const revokeAllUserSessions = async (userId) => {
  if (!userId) return 0;

  const result = await updateManySessions(
    buildSessionRevocationFilter(userId),
    { active: false, revokedAt: new Date() },
  );

  return result.modifiedCount || 0;
};

const isUsableSession = (session, userId, now = new Date()) => {
  if (!session || !userId || session.active !== true || !session.userId) {
    return false;
  }

  const expiresAt = new Date(session.expiresAt).getTime();
  return (
    String(session.userId) === String(userId) &&
    Number.isFinite(expiresAt) &&
    expiresAt > now.getTime()
  );
};

const getActiveSession = async (sessionId, userId) => {
  if (!sessionId || !userId) return null;

  const session = await findSessionById(sessionId);
  return isUsableSession(session, userId) ? session : null;
};

const cleanupExpiredSessions = async () => {
  await deleteExpiredSessions(new Date());
};

export {
  createSession,
  buildSessionRevocationFilter,
  getActiveSession,
  isUsableSession,
  revokeAllUserSessions,
  revokeSession,
  cleanupExpiredSessions,
};
