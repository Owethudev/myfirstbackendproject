import { User } from "../models/user.model.js";
import { resend } from "../config/resend.js";

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // The server checks that the request has the needed information.
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email, and password"
            });
        }
        // The server looks for an account with this email first.
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // A new account is made after the checks pass.
        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password,
            loggedIn: false
        });
 
        if (resend) {
            try {
                const { data, error } = await resend.emails.send({
                    from: "SNPL PORT <onboarding@resend.dev>",
                    to: user.email,
                    subject: "Welcome to SNPL PORT",
                    html: `
                        <h1>Welcome to SNPL PORT, ${user.username}!</h1>
                        <p>Your account has been created successfully.</p>
                        <p>We are excited to have you join the community.</p>
                    `,
                });

                if (error) {
                    throw new Error(error.message);
                }

                console.log("Welcome email sent:", data?.id);
            } catch (emailError) {
                console.error("Welcome email could not be sent:", emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",error: error.message
        });
        
    }
};

const loginUser = async (req, res) => {
    try{

        // The server looks for the account before signing in.
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({
                message: "User does not exist"
            });

            // The saved password is compared with the typed password.
            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(400).json({
                message: "Invalid credentials"
            });

            // The account details are correct, so sign-in can finish.
            res.status(200).json({
                message: "User logged in successfully",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
         
    }catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

const logoutUser = async (req, res) => {
    try{
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({
            message: "User does not exist"
        });

        // The user has been signed out successfully.
        res.status(200).json({
            message: "User logged out successfully"
        });

    }catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
}

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
    try{
        const { email } = req.body;

        const user = await User.findOneAndDelete({ email });

        if (!user) return res.status(400).json({
            message: "User does not exist"
        });

        // The account has been removed successfully.
        res.status(200).json({
            message: "User deleted successfully"
        });
    }catch(error){
        res.status(500).json({
            message: "Internal server error", error
        });
    }
}
export { registerUser, loginUser, logoutUser, updateUser, deleteUser };
