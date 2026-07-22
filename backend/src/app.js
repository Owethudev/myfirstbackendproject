import express from "express";

const app = express(); // This makes the web server.

app.use(express.json()); // This lets the server read JSON data.

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
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import eventPostRouter from "./routes/eventpost.route.js";


// These lines connect paths to their handlers.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/events", eventPostRouter);

export default app;