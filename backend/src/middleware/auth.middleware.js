import sessionMiddleware from "./session.middleware.js";

// JWT validation
const authMiddleware = (req, res, next) => {
  return sessionMiddleware(req, res, next);
};

export default authMiddleware;
