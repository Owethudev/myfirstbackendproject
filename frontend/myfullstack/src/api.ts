import { VITE_API_BASE_URL } from "./config.ts";

const configuredBaseUrl = (VITE_API_BASE_URL ?? "").trim();
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (configuredBaseUrl || "/api").replace(/\/$/, "");

const sanitizePath = (path: string): string => {
  const trimmed = (path ?? "").trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

// This helper joins the server address and the route path.
export const buildApiUrl = (path: string): string => {
  const normalizedPath = sanitizePath(path);
  const normalizedBase = API_BASE_URL || "/";

  if (
    normalizedPath === normalizedBase ||
    normalizedPath.startsWith(`${normalizedBase}/`)
  ) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
};

export const getApiErrorMessage = (payload: unknown, fallback = "Request failed") => {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
};
