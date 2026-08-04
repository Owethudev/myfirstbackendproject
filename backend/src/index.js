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

let server;

const shutdown = (signal) => {
    if (!server) {
        return;
    }

    server.close(() => {
        console.log(`Server stopped gracefully after ${signal}.`);
        process.exit(0);
    });
};

const listenWithPortFallback = (preferredPort) => {
    const candidatePorts = [preferredPort, preferredPort + 1, preferredPort + 2, preferredPort + 3, preferredPort + 4];

    return new Promise((resolve, reject) => {
        const tryPort = (index) => {
            const port = candidatePorts[index];
            const currentServer = app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
                resolve(currentServer);
            });

            currentServer.on("error", (error) => {
                if (error.code === "EADDRINUSE" && index < candidatePorts.length - 1) {
                    console.warn(`Port ${port} is busy. Trying ${candidatePorts[index + 1]} instead.`);
                    currentServer.close(() => tryPort(index + 1));
                    return;
                }

                reject(error);
            });
        };

        tryPort(0);
    });
};

// Start the server after successfully connecting to the database.
const startServer = async () => {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !process.env.JWT_SECRET) {
        console.error("FATAL: JWT_SECRET must be set in production.");
        process.exit(1);
    }

    try {
        await connectDB(); // This connects the server to the database.

        const preferredPort = Number(process.env.PORT || 8000);
        server = await listenWithPortFallback(preferredPort);

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

startServer();