import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { sendVerificationEmail } from "../config/email.js";

const JWT_SECRET = process.env.JWT_SECRET || "wookiepookiebear";

// This registers a new user and sends a verification email.
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

        const baseUrl = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || "https://snpl-port.onrender.com";
        const verificationUrl = `${baseUrl}/api/v1/users/verify/${verificationToken}`;

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

// This verifies a user's email using the token sent in the verification email.
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

// This logs in a user by checking their email and password.
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

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

// This logs out a user by simply acknowledging the request.
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

// This updates a user's profile information.
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

// This deletes a user from the database.
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

const listUsers = async (req, res) => {
    try {
        const { search = "", page = "1", limit = "20" } = req.query;
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

        const totalItems = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit);

        const totalPages = Math.max(Math.ceil(totalItems / parsedLimit), 1);

        res.status(200).json({
            currentPage: parsedPage,
            totalPages,
            totalItems,
            hasNextPage: parsedPage < totalPages,
            items: users,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { suspended } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.suspended = Boolean(suspended);
        await user.save();

        res.status(200).json({
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
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "A valid role is required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
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
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, verifiedUsers, unverifiedUsers, totalPosts] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ verified: true }),
            User.countDocuments({ verified: false }),
            Post.countDocuments(),
        ]);

        res.status(200).json({
            totalUsers,
            verifiedUsers,
            unverifiedUsers,
            totalPosts,
            totalComments: 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export { registerUser, verifyUser, loginUser, logoutUser, updateUser, deleteUser, listUsers, updateUserStatus, updateUserRole, getAdminStats };
