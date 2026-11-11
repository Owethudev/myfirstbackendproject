import { POST_MODERATION_STATUSES } from "../models/post.model.js";

const buildPostReviewUpdates = (payload = {}) => {
  const updates = {};

  if (typeof payload.reported === "boolean") {
    updates.reported = payload.reported;
  }

  if (payload.reportReason !== undefined) {
    updates.reportReason = payload.reportReason;
  }

  if (payload.moderationStatus) {
    if (!POST_MODERATION_STATUSES.includes(payload.moderationStatus)) {
      return { error: "Invalid moderation status" };
    }

    updates.moderationStatus = payload.moderationStatus;
  }

  return { updates };
};

export { buildPostReviewUpdates };
