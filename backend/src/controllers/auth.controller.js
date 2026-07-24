import crypto from "crypto";
import { User } from "../models/user.model.js";
import { sendPasswordResetEmail } from "../config/email.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const isValidPassword = (password) =>
  typeof password === "string" && password.trim().length >= 6;

// This controller intentionally keeps the response generic so a caller
// cannot tell whether an email address exists in the database.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Use Node's crypto module so the raw reset token never gets stored in MongoDB.
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const frontendBaseUrl =
        process.env.FRONTEND_URL ||
        process.env.VITE_API_BASE_URL ||
        "https://snplport.netlify.app";
      const resetUrl = `${frontendBaseUrl}/reset-password/${rawToken}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          username: user.username,
          resetUrl,
        });
      } catch (emailError) {
        console.error("Password reset email could not be sent:", emailError);
        return res.status(500).json({
          success: false,
          message: "Unable to send password reset email at this time.",
        });
      }
    }

    return res.status(200).json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !isValidPassword(password)) {
      return res.status(400).json({
        message: "A valid reset token and password are required.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // The password pre-save hook in the user model will hash the new password.
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { forgotPassword, resetPassword };
