import { Router } from "express";
import { registerUser, verifyUser, loginUser, logoutUser, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = Router(); // This groups the user account paths.

router.route("/register").post(registerUser);
router.route("/verify/:token").get(verifyUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/update").patch(updateUser);
router.route("/delete").delete(deleteUser);

export default router;