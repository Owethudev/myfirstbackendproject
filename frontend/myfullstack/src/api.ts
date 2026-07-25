import { VITE_API_BASE_URL } from "./config.ts";

const configuredBaseUrl = (VITE_API_BASE_URL ?? "").trim();
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (configuredBaseUrl || "/api").replace(/\/$/, "");

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
