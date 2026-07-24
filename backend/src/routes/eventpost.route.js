import { Router } from "express";
import {createEventPost,deleteEventPost,getEventPosts,} from "../controllers/eventpost.controller.js";

// This file defines the routes for event-related operations, including creating, retrieving, and deleting events.
const router = Router(); 

// These are the three event paths that the frontend can use to create, get, and delete events.
router.route("/create").post(createEventPost);
router.route("/getEvents").get(getEventPosts);
router.route("/delete/:id").delete(deleteEventPost);

export default router;