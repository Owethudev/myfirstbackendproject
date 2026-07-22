import { VITE_API_BASE_URL } from "./config.ts";

const API_BASE_URL = VITE_API_BASE_URL ?? "/api";

// This helper joins the server address and the route path.
export const buildApiUrl = (path: string): string =>
  `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
