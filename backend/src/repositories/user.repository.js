import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";

const createUser = async (payload) => User.create(payload);

const findUserByEmail = async (email) => User.findOne({ email });

const findUserById = async (id) => User.findById(id);

const findUserByVerificationToken = async (token) => User.findOne({ verificationToken: token });

const findUserByResetToken = async (token) => User.findOne({ resetPasswordToken: token });

const findUsers = async ({ query = {}, skip = 0, limit = 20, sort = { createdAt: -1 } }) => {
  const [items, totalItems] = await Promise.all([
    User.find(query).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires").sort(sort).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return { items, totalItems };
};

const countUsers = async (query = {}) => User.countDocuments(query);

const countPosts = async (query = {}) => Post.countDocuments(query);

const deleteUserByEmail = async (email) => User.findOneAndDelete({ email });

const saveUser = async (user) => user.save();

export {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  findUserByResetToken,
  findUsers,
  countUsers,
  countPosts,
  deleteUserByEmail,
  saveUser,
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  findUserByResetToken,
  findUsers,
  countUsers,
  countPosts,
  deleteUserByEmail,
  saveUser,
};