import { VITE_API_BASE_URL } from "./config.ts";

const API_BASE_URL = (VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

// This helper joins the server address and the route path.
export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = API_BASE_URL || "/";

  if (
    normalizedPath === normalizedBase ||
    normalizedPath.startsWith(`${normalizedBase}/`)
  ) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
};
