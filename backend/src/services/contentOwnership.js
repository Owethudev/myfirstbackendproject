const getContentAuthor = (principal) => {
  if (
    !principal ||
    !["user", "admin"].includes(principal.role) ||
    typeof principal.username !== "string" ||
    !principal.username.trim()
  ) {
    return null;
  }

  return principal.username.trim();
};

const canManageContent = (principal, author) => {
  if (!principal || !["user", "admin"].includes(principal.role)) {
    return false;
  }

  if (principal.role === "admin") {
    return true;
  }

  return typeof author === "string" && getContentAuthor(principal) === author;
};

const pickPostContentUpdates = (payload = {}) => {
  const updates = {};
  for (const field of ["name", "description", "portfolio"]) {
    if (Object.hasOwn(payload, field)) {
      updates[field] = payload[field];
    }
  }

  return updates;
};

export { canManageContent, getContentAuthor, pickPostContentUpdates };
