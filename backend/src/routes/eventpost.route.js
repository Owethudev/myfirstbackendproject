import { Router } from "express";
import {
    createEventPost,
    deleteEventPost,
    getEventPosts,
} from "../controllers/eventpost.controller.js";

const router = Router(); // This groups the event paths.

router.route("/create").post(createEventPost);
router.route("/getEvents").get(getEventPosts);
router.route("/delete/:id").delete(deleteEventPost);

export default router;