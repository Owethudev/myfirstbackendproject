import { EventPost } from "../models/eventpost.model.js";

const createEventPost = async (payload) => EventPost.create(payload);

const findEventPosts = async ({ query = {}, skip = 0, limit = 12 }) => {
  const [items, totalItems] = await Promise.all([
    EventPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EventPost.countDocuments(query),
  ]);

  return { items, totalItems };
};

const findEventPostById = async (id) => EventPost.findById(id);

const deleteEventPostById = async (id) => EventPost.findByIdAndDelete(id);

export { createEventPost, findEventPosts, findEventPostById, deleteEventPostById };

export default { createEventPost, findEventPosts, findEventPostById, deleteEventPostById };