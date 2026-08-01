import { Router } from "express";
import { createPost, getPosts, getReportedPosts, reviewPost, updatePost, deletePost, adminDeletePost } from "../controllers/post.controller.js";
import authorize from "../middleware/authorize.middleware.js";

// This file defines the routes for project post-related operations, including creating, retrieving, updating, and deleting posts.
const router = Router(); 

// These are the four project post paths that the frontend can use to create, get, update, and delete posts.
router.route("/create").post(authorize("user", "admin"), createPost);
router.route("/getPosts").get(getPosts);
router.route("/reported").get(authorize("admin"), getReportedPosts);
router.route("/review/:id").patch(authorize("admin"), reviewPost);
router.route("/update/:id").patch(authorize("user", "admin"), updatePost);
router.route("/delete/:id").delete(authorize("user", "admin"), deletePost);
router.route("/admin-delete/:id").delete(authorize("admin"), adminDeletePost);
export default router;