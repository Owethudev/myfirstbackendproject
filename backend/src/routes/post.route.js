import { Router } from "express";
import { createPost , getPosts , updatePost , deletePost} from "../controllers/post.controller.js";

// This file defines the routes for project post-related operations, including creating, retrieving, updating, and deleting posts.
const router = Router(); 

// These are the four project post paths that the frontend can use to create, get, update, and delete posts.
router.route("/create").post(createPost);
router.route("/getPosts").get(getPosts);
router.route("/update/:id").patch(updatePost);
router.route("/delete/:id").delete(deletePost);
export default router;