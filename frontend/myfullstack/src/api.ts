import { VITE_API_BASE_URL } from "./config.ts";

const API_BASE_URL = VITE_API_BASE_URL ?? "/api";

// I keep URL normalization in one place so every request uses the same API base.
export const buildApiUrl = (path: string): string =>
  `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
