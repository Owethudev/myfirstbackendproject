import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime
        ? new Date(req.rateLimit.resetTime).getTime()
        : Date.now() + windowMs;
      const retryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));

      res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message,
        retryAfter,
      });
    },
  });

export const generalApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again in 15 minutes.",
});

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const signupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Please try again in 1 hour.",
});

export const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many password reset requests. Please try again in 1 hour.",
});
