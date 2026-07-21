import { Router } from "express";
import { registerUser, loginUser ,logoutUser , deleteUser} from "../controllers/user.controller.js";

const router = Router(); // create a router instance

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/delete").delete(deleteUser);

export default router;