import express from "express";
import authMiddleware from "./middleware/auth.middleware.js";
import auditMiddleware from "./middleware/audit.middleware.js";
import { generalApiLimiter } from "./middleware/rateLimiter.middleware.js";

// This file sets up the Express server, including middleware for JSON parsing and CORS headers, and connects the user, post, and event routes to their respective controllers.
const app = express();

app.disable("x-powered-by");

// This middleware allows the server to parse incoming JSON requests.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// This middleware sets the necessary headers to allow cross-origin requests from any domain, and handles preflight OPTIONS requests.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// These files contain the server paths.
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import eventPostRouter from "./routes/eventpost.route.js";
import auditRouter from "./routes/audit.route.js";

app.use(authMiddleware);
app.use(auditMiddleware);
app.use(generalApiLimiter);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
    });
});

// These lines connect paths to their handlers.
app.use("/api/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/events", eventPostRouter);
app.use("/api/v1/audit", auditRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON payload.",
        });
    }

    if (error && typeof error === "object" && "statusCode" in error && "payload" in error) {
        return res.status(error.statusCode).json(error.payload);
    }

    console.error(`Unhandled error on ${req.method} ${req.path}:`, error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

export default app;