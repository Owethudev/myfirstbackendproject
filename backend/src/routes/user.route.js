import { Router } from "express";
import { registerUser, verifyUser, loginUser, logoutUser, updateUser, deleteUser } from "../controllers/user.controller.js";
import authorize from "../middleware/authorize.middleware.js";

// This file defines the routes for user-related operations, including registration, verification, login, logout, profile update, and deletion.
const router = Router(); 

// These are the six user paths that the frontend can use to register, verify, login, logout, update, and delete users.
router.route("/register").post(registerUser);
router.route("/verify/:token").get(verifyUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/update").patch(authorize("user", "admin"), updateUser);
router.route("/delete").delete(authorize("admin"), deleteUser);

export default router;