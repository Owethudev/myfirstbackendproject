import { User } from "../models/user.model.js";
import { getActiveSession } from "../services/session.service.js";
import { verifyAccessToken } from "../utils/auth.js";

// Security middleware
const sessionMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    req.session = null;
    return next();
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "Session expired." });
  }

  try {
    const decoded = verifyAccessToken(token);
    const activeSession = await getActiveSession(decoded.jti);

    if (!activeSession) {
      return res.status(401).json({ success: false, message: "Session expired." });
    }

    const user = await User.findById(decoded.id).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(401).json({ success: false, message: "Session expired." });
    }

    if (user.suspended) {
      return res.status(401).json({ success: false, message: "Account suspended." });
    }

    req.user = {
      ...decoded,
      role: user.role,
      username: user.username,
      email: user.email,
      suspended: user.suspended,
    };
    req.session = activeSession;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Session expired." });
  }
};

export default sessionMiddleware;
