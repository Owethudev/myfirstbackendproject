import { Post } from "../models/post.model.js";

const createPost = async (payload) => Post.create(payload);

const findPosts = async ({ query, skip, limit, sort = { createdAt: -1 } }) => {
  const [items, totalItems] = await Promise.all([
    Post.find(query).sort(sort).skip(skip).limit(limit),
    Post.countDocuments(query),
  ]);

  return { items, totalItems };
};

const findPostById = async (id) => Post.findById(id);

const findPostByIdAndUpdate = async (id, updates) => Post.findByIdAndUpdate(id, updates, { new: true });

const deletePostById = async (id) => Post.findByIdAndDelete(id);

const savePost = async (post) => post.save();

export {
  createPost,
  findPosts,
  findPostById,
  findPostByIdAndUpdate,
  deletePostById,
  savePost,
};

export default {
  createPost,
  findPosts,
  findPostById,
  findPostByIdAndUpdate,
  deletePostById,
  savePost,
};