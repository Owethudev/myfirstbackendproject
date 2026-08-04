import { buildApiUrl, getApiErrorMessage, parseJsonResponse } from "../api.ts";
import { clearAuthState, getStoredSessionId, getStoredToken, getStoredUser, persistAuthState } from "./sessionManager.ts";

type AuthResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role?: "user" | "admin";
  };
};

const buildJsonHeaders = (token?: string | null) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const authService = {
  async login(payload: { email: string; password: string }) {
    const response = await fetch(buildApiUrl("/api/v1/users/login"), {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse<AuthResponse>(response);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, "Login failed"));
    }

    if (data.user) {
      persistAuthState(data.user, data.token ?? null, (data as { sessionId?: string }).sessionId ?? null);
    }

    return data;
  },

  async logout(options: { logoutAll?: boolean } = {}) {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    try {
      await fetch(buildApiUrl("/api/v1/users/logout"), {
        method: "POST",
        headers: buildJsonHeaders(token),
        body: JSON.stringify({
          email: storedUser?.email,
          sessionId: getStoredSessionId(),
          logoutAll: options.logoutAll ?? false,
        }),
      });
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      clearAuthState();
    }
  },

  async fetchJson(path: string, options: RequestInit = {}) {
    const token = getStoredToken();
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        ...buildJsonHeaders(token),
        ...(options.headers || {}),
      },
    });

    const data = await parseJsonResponse<{ success?: boolean; message?: string }>(response);
    if (response.status === 401 && data.message) {
      clearAuthState(data.message);
      throw new Error(data.message);
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, "Request failed"));
    }

    return data;
  },
};
