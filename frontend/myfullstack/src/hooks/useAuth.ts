import { useEffect, useState } from "react";
import type { UserProfile } from "../types.ts";
import {
  getSessionMessage,
  getStoredToken,
  getStoredUser,
  handleSessionExpired,
} from "../services/sessionManager.ts";

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [message, setMessage] = useState(getSessionMessage);

  useEffect(() => {
    const syncState = () => {
      setUser(getStoredUser());
      setToken(getStoredToken());
      setMessage(getSessionMessage());
    };

    window.addEventListener("auth:state-changed", syncState);
    syncState();

    return () => {
      window.removeEventListener("auth:state-changed", syncState);
    };
  }, []);

  const signOut = (reason = "Your session has expired. Please log in again.") => {
    handleSessionExpired(reason);
    setUser(null);
    setToken(null);
    setMessage(reason);
    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  };

  return { user, token, message, signOut, setMessage };
};
