import { createError, createResult } from "../utils/controllerResponse.js";
import {
  createPost as createPostRepository,
  deletePostById,
  findPostById,
  findPostByIdAndUpdate,
  findPosts,
  savePost,
} from "../repositories/post.repository.js";

const parsePagination = (query) => {
  const page = query?.page ?? "1";
  const limit = query?.limit ?? "12";
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  return { parsedPage, parsedLimit, skip };
};

const createPost = async ({ name, description, portfolio, author }) => {
  if (!name || !description || !portfolio) {
    return createError(400, "Please provide name, description and portfolio");
  }

  const post = await createPostRepository({
    name,
    description,
    portfolio,
    author: author ?? "Unknown",
  });

  return createResult(201, {
    message: "Post created successfully",
    post,
  });
};

const getPosts = async (query = {}) => {
  const { parsedPage, parsedLimit, skip } = parsePagination(query);
  const result = await findPosts({
    query: { moderationStatus: { $ne: "removed" } },
    skip,
    limit: parsedLimit,
  });

  const totalPages = Math.max(Math.ceil(result.totalItems / parsedLimit), 1);

  return createResult(200, {
    currentPage: parsedPage,
    totalPages,
    totalItems: result.totalItems,
    hasNextPage: parsedPage < totalPages,
    items: result.items,
  });
};

const getReportedPosts = async (query = {}) => {
  const { parsedPage, parsedLimit, skip } = parsePagination({ ...query, limit: query?.limit ?? "20" });
  const result = await findPosts({
    query: { reported: true },
    skip,
    limit: parsedLimit,
  });

  const totalPages = Math.max(Math.ceil(result.totalItems / parsedLimit), 1);

  return createResult(200, {
    currentPage: parsedPage,
    totalPages,
    totalItems: result.totalItems,
    hasNextPage: parsedPage < totalPages,
    items: result.items,
  });
};

const reviewPost = async (id, payload = {}) => {
  const post = await findPostById(id);
  if (!post) {
    return createError(404, "Post not found");
  }

  if (typeof payload.reported === "boolean") {
    post.reported = payload.reported;
  }

  if (payload.reportReason !== undefined) {
    post.reportReason = payload.reportReason;
  }

  if (payload.moderationStatus) {
    post.moderationStatus = payload.moderationStatus;
  }

  await savePost(post);

  return createResult(200, {
    message: "Post review updated",
    post,
  });
};

const updatePost = async (id, payload = {}) => {
  if (Object.keys(payload).length === 0) {
    return createError(400, "Please provide data to update");
  }

  const post = await findPostByIdAndUpdate(id, payload, { new: true });
  if (!post) {
    return createError(404, "Post not found");
  }

  return createResult(200, {
    message: "Post updated successfully",
    post,
  });
};

const deletePost = async (id, payload = {}) => {
  const post = await findPostById(id);
  if (!post) {
    return createError(404, "Post not found");
  }

  const { username } = payload;
  if (!username || post.author !== username) {
    return createError(403, "You are not authorized to delete this post");
  }

  await deletePostById(id);

  return createResult(200, { message: "Post deleted successfully" });
};

const adminDeletePost = async (id) => {
  const post = await findPostById(id);
  if (!post) {
    return createError(404, "Post not found");
  }

  post.moderationStatus = "removed";
  post.reported = true;
  await savePost(post);

  return createResult(200, { message: "Post removed by admin" });
};

export {
  createPost,
  getPosts,
  getReportedPosts,
  reviewPost,
  updatePost,
  deletePost,
  adminDeletePost,
};

export default {
  createPost,
  getPosts,
  getReportedPosts,
  reviewPost,
  updatePost,
  deletePost,
  adminDeletePost,
};