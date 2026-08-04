import { createError, createResult } from "../utils/controllerResponse.js";
import {
  createEventPost as createEventPostRepository,
  deleteEventPostById,
  findEventPostById,
  findEventPosts,
} from "../repositories/eventpost.repository.js";

const parsePagination = (query = {}) => {
  const page = query.page ?? "1";
  const limit = query.limit ?? "12";
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  return { parsedPage, parsedLimit, skip };
};

const createEventPost = async ({ name, location, theme, time, author }) => {
  if (!name || !location || !theme || !time) {
    return createError(400, "Please provide name, location, theme and time");
  }

  const event = await createEventPostRepository({
    name,
    location,
    theme,
    time,
    author: author ?? "Unknown",
  });

  return createResult(201, {
    message: "Event created successfully",
    event,
  });
};

const getEventPosts = async (query = {}) => {
  const { parsedPage, parsedLimit, skip } = parsePagination(query);
  const result = await findEventPosts({ skip, limit: parsedLimit });
  const totalPages = Math.max(Math.ceil(result.totalItems / parsedLimit), 1);

  return createResult(200, {
    currentPage: parsedPage,
    totalPages,
    totalItems: result.totalItems,
    hasNextPage: parsedPage < totalPages,
    items: result.items,
  });
};

const deleteEventPost = async (id, payload = {}) => {
  const event = await findEventPostById(id);
  if (!event) {
    return createError(404, "Event not found");
  }

  const { username } = payload;
  if (!username || event.author !== username) {
    return createError(403, "You are not authorized to delete this event");
  }

  await deleteEventPostById(id);

  return createResult(200, { message: "Event deleted successfully" });
};

export { createEventPost, getEventPosts, deleteEventPost };
export default { createEventPost, getEventPosts, deleteEventPost };