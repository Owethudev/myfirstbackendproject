import { Session } from "../models/session.model.js";

const createSession = async (payload) => Session.create(payload);

const findSessionById = async (sessionId) => Session.findOne({ sessionId });

const updateSession = async (filter, updates) => Session.findOneAndUpdate(filter, updates, { new: true });

const updateManySessions = async (filter, updates) => Session.updateMany(filter, updates);

const deleteExpiredSessions = async (date) => Session.deleteMany({ expiresAt: { $lt: date } });

export { createSession, findSessionById, updateSession, updateManySessions, deleteExpiredSessions };

export default { createSession, findSessionById, updateSession, updateManySessions, deleteExpiredSessions };