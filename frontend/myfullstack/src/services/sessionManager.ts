import type { UserProfile } from "../types.ts";

const USER_STORAGE_KEY = "snpl_user";
const TOKEN_STORAGE_KEY = "snpl_token";
const SESSION_ID_STORAGE_KEY = "snpl_session_id";
const SESSION_MESSAGE_KEY = "snpl_session_message";

export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch (error) {
    console.error("failed reading local user", error);
    return null;
  }
};

export const getStoredToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("failed reading local token", error);
    return null;
  }
};

export const getStoredSessionId = (): string | null => {
  try {
    return window.localStorage.getItem(SESSION_ID_STORAGE_KEY);
  } catch (error) {
    console.error("failed reading local session id", error);
    return null;
  }
};

export const persistAuthState = (user: UserProfile | null, token: string | null, sessionId?: string | null) => {
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }

    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (sessionId) {
      window.localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    } else {
      window.localStorage.removeItem(SESSION_ID_STORAGE_KEY);
    }
  } catch (error) {
    console.error("failed persisting auth state", error);
  }
};

export const clearAuthState = (message = "") => {
  try {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_ID_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_MESSAGE_KEY);
  } catch (error) {
    console.error("failed clearing auth state", error);
  }

  if (message) {
    try {
      window.localStorage.setItem(SESSION_MESSAGE_KEY, message);
    } catch (error) {
      console.error("failed persisting session message", error);
    }
  }

  window.dispatchEvent(new Event("auth:state-changed"));
};

export const getSessionMessage = (): string => {
  try {
    return window.localStorage.getItem(SESSION_MESSAGE_KEY) || "";
  } catch (error) {
    console.error("failed reading session message", error);
    return "";
  }
};

export const handleSessionExpired = (message = "Your session has expired. Please log in again.") => {
  clearAuthState(message);
};

export const isAuthenticated = (): boolean => Boolean(getStoredUser() && getStoredToken());
