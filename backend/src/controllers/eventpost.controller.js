import { handleControllerError } from "../utils/controllerResponse.js";
import {
    createEventPost as createEventPostService,
    getEventPosts as getEventPostsService,
    deleteEventPost as deleteEventPostService,
} from "../services/eventpost.service.js";

const createEventPost = async (req, res) => {
    try {
        const result = await createEventPostService(req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const getEventPosts = async (req, res) => {
    try {
        const result = await getEventPostsService(req.query);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const deleteEventPost = async (req, res) => {
    try {
        const result = await deleteEventPostService(req.params.id, req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

export { createEventPost, getEventPosts, deleteEventPost };
