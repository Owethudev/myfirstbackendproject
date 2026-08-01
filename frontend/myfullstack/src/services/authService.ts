import { buildApiUrl } from "../api.ts";
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

export const authService = {
  async login(payload: { email: string; password: string }) {
    const response = await fetch(buildApiUrl("/api/v1/users/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as AuthResponse;
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (response.status === 401 && data.message) {
      clearAuthState(data.message);
      throw new Error(data.message);
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  },
};
