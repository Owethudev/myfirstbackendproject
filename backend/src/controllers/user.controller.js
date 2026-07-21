import { User } from "../models/user.model.js";
import { resend } from "../config/resend.js";

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        //basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email, and password"
            });
        }
        // check if user already exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // create new user
        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password,
            loggedIn: false
        });


        // Send the welcome email when Resend is configured.
        if (resend) {
            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: "jezileowethu@gmail.com",
                subject: "Hello World",
                html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
            });
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

        //checking if user exists
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({
                message: "User does not exist"
            });

            //compare passwords
            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(400).json({
                message: "Invalid credentials"
            });

            //login successful
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

        //logout successful
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

        //delete successful
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
