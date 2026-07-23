import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model.js";
import { sendVerificationEmail } from "../config/email.js";

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email, and password"
            });
        }

        const normalizedEmail = email.toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const verificationToken = uuidv4();
        const user = await User.create({
            username,
            email: normalizedEmail,
            password,
            verified: false,
            verificationToken,
        });

        const siteUrl = process.env.FRONTEND_URL || process.env.VITE_API_BASE_URL || process.env.BACKEND_URL || "https://snpl-port.onrender.com";
        const verificationUrl = `${siteUrl}/api/v1/users/verify/${verificationToken}`;

        try {
            console.log(`Attempting to send verification email to ${user.email}`);
            await sendVerificationEmail({
                to: user.email,
                username: user.username,
                verificationUrl,
            });
        } catch (emailError) {
            console.error("Verification email could not be sent:", emailError);
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({
                success: false,
                message: "Account could not be created because the verification email could not be sent."
            });
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const verifyUser = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.verified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.redirect(`${process.env.FRONTEND_URL || process.env.VITE_API_BASE_URL || process.env.BACKEND_URL || "https://snpl-port.onrender.com"}/?verified=1`);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.verified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id, username, email, password } = req.body;

        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (username) user.username = username;
        if (email) user.email = email.toLowerCase();
        if (password) user.password = password;

        if (!username && !email && !password) {
            return res.status(400).json({ message: "Please provide data to update" });
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOneAndDelete({ email });

        if (!user) return res.status(400).json({
            message: "User does not exist"
        });

        res.status(200).json({
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
};

export { registerUser, verifyUser, loginUser, logoutUser, updateUser, deleteUser };
