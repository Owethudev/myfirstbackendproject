import express from "express";

// This file sets up the Express server, including middleware for JSON parsing and CORS headers, and connects the user, post, and event routes to their respective controllers.
const app = express(); 

// This middleware allows the server to parse incoming JSON requests.
app.use(express.json()); 

// This middleware sets the necessary headers to allow cross-origin requests from any domain, and handles preflight OPTIONS requests.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

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


// These lines connect paths to their handlers.
app.use("/api/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/events", eventPostRouter);

export default app;