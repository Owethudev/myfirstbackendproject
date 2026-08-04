import type { UserProfile } from "../types.ts";

const USER_STORAGE_KEY = "snpl_user";
const TOKEN_STORAGE_KEY = "snpl_token";
const SESSION_ID_STORAGE_KEY = "snpl_session_id";
const SESSION_MESSAGE_KEY = "snpl_session_message";

const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error(`failed reading storage key ${key}`, error);
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error(`failed writing storage key ${key}`, error);
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`failed removing storage key ${key}`, error);
    }
  },
};

export const getStoredUser = (): UserProfile | null => {
  const raw = safeStorage.get(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    console.error("failed parsing stored user", error);
    safeStorage.remove(USER_STORAGE_KEY);
    return null;
  }
};

export const getStoredToken = (): string | null => safeStorage.get(TOKEN_STORAGE_KEY);

export const getStoredSessionId = (): string | null => safeStorage.get(SESSION_ID_STORAGE_KEY);

export const persistAuthState = (user: UserProfile | null, token: string | null, sessionId?: string | null) => {
  if (user) {
    safeStorage.set(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    safeStorage.remove(USER_STORAGE_KEY);
  }

  if (token) {
    safeStorage.set(TOKEN_STORAGE_KEY, token);
  } else {
    safeStorage.remove(TOKEN_STORAGE_KEY);
  }

  if (sessionId) {
    safeStorage.set(SESSION_ID_STORAGE_KEY, sessionId);
  } else {
    safeStorage.remove(SESSION_ID_STORAGE_KEY);
  }
};

export const clearAuthState = (message = "") => {
  safeStorage.remove(USER_STORAGE_KEY);
  safeStorage.remove(TOKEN_STORAGE_KEY);
  safeStorage.remove(SESSION_ID_STORAGE_KEY);
  safeStorage.remove(SESSION_MESSAGE_KEY);

  if (message) {
    safeStorage.set(SESSION_MESSAGE_KEY, message);
  }

  window.dispatchEvent(new Event("auth:state-changed"));
};

export const getSessionMessage = (): string => safeStorage.get(SESSION_MESSAGE_KEY) || "";

export const handleSessionExpired = (message = "Your session has expired. Please log in again.") => {
  clearAuthState(message);
};

export const isAuthenticated = (): boolean => Boolean(getStoredUser() && getStoredToken());
