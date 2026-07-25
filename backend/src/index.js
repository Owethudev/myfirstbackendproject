import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import app from "./app.js";

// Get the current file path so we can resolve the backend .env file reliably.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file.
dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

// Start the server after successfully connecting to the database.
const startServer = async () => {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !process.env.JWT_SECRET) {
        console.error("FATAL: JWT_SECRET must be set in production.");
        process.exit(1);
    }

    try {
        await connectDB(); // This connects the server to the database.

        app.on("error", (error) => {
            console.log("Error starting server:", error);
            throw error;
        });

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    } catch (error) {
        console.log("mngoDB connection failed", error);
    }
};

startServer();