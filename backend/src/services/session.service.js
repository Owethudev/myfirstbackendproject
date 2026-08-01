import { v4 as uuidv4 } from "uuid";
import { Session } from "../models/session.model.js";
import { parseExpiryToMilliseconds } from "../utils/auth.js";

const createSession = async ({ userId, userAgent = "", ipAddress = "" }) => {
  const expiresAt = new Date(Date.now() + parseExpiryToMilliseconds(process.env.JWT_ACCESS_TOKEN_EXPIRY || "30m"));
  const sessionId = uuidv4();

  const session = await Session.create({
    userId,
    sessionId,
    userAgent,
    ipAddress,
    expiresAt,
    active: true,
  });

  return session;
};

const revokeSession = async (sessionId) => {
  if (!sessionId) return null;

  return Session.findOneAndUpdate(
    { sessionId },
    { active: false, revokedAt: new Date() },
    { new: true },
  );
};

const revokeAllUserSessions = async (userId) => {
  if (!userId) return 0;

  const result = await Session.updateMany(
    { userId, active: true },
    { active: false, revokedAt: new Date() },
  );

  return result.modifiedCount || 0;
};

const getActiveSession = async (sessionId) => {
  if (!sessionId) return null;

  return Session.findOne({ sessionId, active: true, revokedAt: null, expiresAt: { $gt: new Date() } });
};

const cleanupExpiredSessions = async () => {
  await Session.deleteMany({ expiresAt: { $lt: new Date() } });
};

export { createSession, getActiveSession, revokeAllUserSessions, revokeSession, cleanupExpiredSessions };
