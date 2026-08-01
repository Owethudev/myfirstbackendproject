import { authService } from "./authService.ts";

export const apiClient = {
  get: async (path: string, init?: RequestInit) => authService.fetchJson(path, { ...init, method: "GET" }),
  post: async (path: string, body?: unknown, init?: RequestInit) =>
    authService.fetchJson(path, {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: async (path: string, init?: RequestInit) => authService.fetchJson(path, { ...init, method: "DELETE" }),
};
