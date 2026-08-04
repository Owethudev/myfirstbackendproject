import { handleControllerError } from "../utils/controllerResponse.js";
import {
    createPost as createPostService,
    getPosts as getPostsService,
    getReportedPosts as getReportedPostsService,
    reviewPost as reviewPostService,
    updatePost as updatePostService,
    deletePost as deletePostService,
    adminDeletePost as adminDeletePostService,
} from "../services/post.service.js";

const createPost = async (req, res) => {
    try {
        const result = await createPostService(req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const getPosts = async (req, res) => {
    try {
        const result = await getPostsService(req.query);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const getReportedPosts = async (req, res) => {
    try {
        const result = await getReportedPostsService(req.query);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const reviewPost = async (req, res) => {
    try {
        const result = await reviewPostService(req.params.id, req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const updatePost = async (req, res) => {
    try {
        const result = await updatePostService(req.params.id, req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const deletePost = async (req, res) => {
    try {
        const result = await deletePostService(req.params.id, req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

const adminDeletePost = async (req, res) => {
    try {
        const result = await adminDeletePostService(req.params.id);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Internal server error");
    }
};

export { createPost, getPosts, getReportedPosts, reviewPost, updatePost, deletePost, adminDeletePost };
