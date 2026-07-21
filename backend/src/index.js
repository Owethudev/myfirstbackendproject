import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import app from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
}); // load environment variables from .env file

const startServer = async () => {
    try {
        await connectDB(); // connect to the database

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