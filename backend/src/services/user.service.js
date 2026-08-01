import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { sendVerificationEmail } from "../config/email.js";
import { createError, createResult } from "../utils/controllerResponse.js";
import { signAccessToken } from "../utils/auth.js";
import { createSession, revokeAllUserSessions, revokeSession } from "../services/session.service.js";

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const validateRequiredFields = (fields, payload) => {
  const missing = Object.entries(fields).filter(([, value]) => !value);
  if (missing.length) {
    return createError(400, `Please provide ${missing.map(([key]) => key).join(", ")}`);
  }

  return null;
};

const registerUser = async ({ username, email, password }) => {
  const inputValidation = validateRequiredFields({ username, email, password }, { username, email, password });
  if (inputValidation) return inputValidation;

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return createError(400, "User already exists");
  }

  const verificationToken = uuidv4();
  const user = await User.create({
    username,
    email: normalizedEmail,
    password,
    verified: false,
    verificationToken,
  });

  const baseUrl = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || "https://snpl-port.onrender.com";
  const verificationUrl = `${baseUrl}/api/v1/users/verify/${verificationToken}`;

  try {
    await sendVerificationEmail({
      to: user.email,
      username: user.username,
      verificationUrl,
    });
  } catch (emailError) {
    await User.findByIdAndDelete(user._id);
    return createError(500, "Account could not be created because the verification email could not be sent.", {
      error: emailError.message,
    });
  }

  return createResult(201, {
    success: true,
    message: "User registered successfully. Please verify your email.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

const verifyUser = async (token) => {
  if (!token) {
    return createError(400, "Verification token is required");
  }

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return createError(400, "Invalid or expired verification token");
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  return createResult(200, {
    redirectUrl: `${process.env.FRONTEND_URL || process.env.VITE_API_BASE_URL || process.env.BACKEND_URL || "https://snpl-port.onrender.com"}/?verified=1`,
  });
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return createError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return createError(400, "User does not exist");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return createError(400, "Invalid credentials");
  }

  if (!user.verified) {
    return createError(403, "Please verify your email before logging in");
  }

  if (user.suspended) {
    return createError(403, "Account suspended.");
  }

  const session = await createSession({ userId: user._id, userAgent: "", ipAddress: "" });
  const token = signAccessToken(user, session.sessionId);

  return createResult(200, {
    message: "User logged in successfully",
    token,
    sessionId: session.sessionId,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

const logoutUser = async (email, sessionId, logoutAll = false) => {
  if (!email) {
    return createError(400, "Email is required");
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    return createError(400, "User does not exist");
  }

  if (logoutAll || !sessionId) {
    await revokeAllUserSessions(user._id);
  } else {
    await revokeSession(sessionId);
  }

  return createResult(200, { message: "User logged out successfully" });
};

const updateUser = async ({ id, username, email, password }) => {
  if (!id) {
    return createError(400, "User id is required");
  }

  const user = await User.findById(id);
  if (!user) {
    return createError(404, "User not found");
  }

  if (username) user.username = username;
  if (email) user.email = normalizeEmail(email);
  if (password) user.password = password;

  if (!username && !email && !password) {
    return createError(400, "Please provide data to update");
  }

  await user.save();

  return createResult(200, {
    message: "Profile updated successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

const deleteUser = async (email) => {
  if (!email) {
    return createError(400, "Email is required");
  }

  const user = await User.findOneAndDelete({ email: normalizeEmail(email) });
  if (!user) {
    return createError(400, "User does not exist");
  }

  return createResult(200, { message: "User deleted successfully" });
};

const listUsers = async ({ search = "", page = "1", limit = "20" }) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const query = search
    ? {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [totalItems, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / parsedLimit), 1);

  return createResult(200, {
    currentPage: parsedPage,
    totalPages,
    totalItems,
    hasNextPage: parsedPage < totalPages,
    items: users,
  });
};

const updateUserStatus = async (id, suspended) => {
  const user = await User.findById(id);
  if (!user) {
    return createError(404, "User not found");
  }

  user.suspended = Boolean(suspended);
  await user.save();

  return createResult(200, {
    message: user.suspended ? "User suspended successfully" : "User reactivated successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.verified,
      suspended: user.suspended,
    },
  });
};

const updateUserRole = async (id, role) => {
  if (!role || !["user", "admin"].includes(role)) {
    return createError(400, "A valid role is required");
  }

  const user = await User.findById(id);
  if (!user) {
    return createError(404, "User not found");
  }

  user.role = role;
  await user.save();

  return createResult(200, {
    message: "User role updated successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.verified,
      suspended: user.suspended,
    },
  });
};

const getAdminStats = async () => {
  const [totalUsers, verifiedUsers, unverifiedUsers, totalPosts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ verified: true }),
    User.countDocuments({ verified: false }),
    Post.countDocuments(),
  ]);

  return createResult(200, {
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    totalPosts,
    totalComments: 0,
  });
};

export {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  getAdminStats,
};

export default {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  getAdminStats,
};
