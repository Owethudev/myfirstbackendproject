import crypto from "crypto";
import { sendPasswordResetEmail } from "../config/email.js";
import { createError, createResult } from "../utils/controllerResponse.js";
import { findUserByEmail, findUserByResetToken, saveUser } from "../repositories/user.repository.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const isValidPassword = (password) => typeof password === "string" && password.trim().length >= 6;

const forgotPassword = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return createError(400, "Please provide a valid email address.");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await saveUser(user);

    const frontendBaseUrl = process.env.FRONTEND_URL || process.env.VITE_API_BASE_URL || "https://snplport.netlify.app";
    const resetUrl = `${frontendBaseUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
      });
    } catch (emailError) {
      return createError(500, "Unable to send password reset email at this time.", {
        error: emailError.message,
      });
    }
  }

  return createResult(200, {
    message: "If an account exists with that email, a password reset link has been sent.",
  });
};

const resetPassword = async ({ token, password }) => {
  if (!token || !isValidPassword(password)) {
    return createError(400, "A valid reset token and password are required.");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findUserByResetToken(hashedToken);

  if (!user) {
    return createError(400, "Invalid or expired reset token.");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await saveUser(user);

  return createResult(200, {
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
};

export { forgotPassword, resetPassword };
export default { forgotPassword, resetPassword };
