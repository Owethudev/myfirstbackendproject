import crypto from "crypto";
import jwt from "jsonwebtoken";

const DEFAULT_JWT_EXPIRY = "30m";

const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return crypto.randomBytes(32).toString("hex");
};

const getJwtExpiry = () => process.env.JWT_ACCESS_TOKEN_EXPIRY || DEFAULT_JWT_EXPIRY;

const parseExpiryToMilliseconds = (expiry) => {
  if (!expiry) {
    return 30 * 60 * 1000;
  }

  const match = /^([0-9]+)([smhd])$/.exec(expiry.trim().toLowerCase());
  if (!match) {
    return 30 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 30 * 60 * 1000;
  }
};

const createJwtPayload = (user, sessionId) => ({
  id: user._id?.toString() || user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  jti: sessionId,
});

const signAccessToken = (user, sessionId) =>
  jwt.sign(createJwtPayload(user, sessionId), getJwtSecret(), {
    expiresIn: getJwtExpiry(),
  });

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());

export {
  createJwtPayload,
  getJwtExpiry,
  getJwtSecret,
  parseExpiryToMilliseconds,
  signAccessToken,
  verifyAccessToken,
};
