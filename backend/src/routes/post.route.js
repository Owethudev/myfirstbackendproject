import { Router } from "express";
import { createPost , getPosts , updatePost , deletePost} from "../controllers/post.controller.js";

const router = Router(); // This groups the project post paths.

router.route("/create").post(createPost);
router.route("/getPosts").get(getPosts);
router.route("/update/:id").patch(updatePost);
router.route("/delete/:id").delete(deletePost);
export default router;