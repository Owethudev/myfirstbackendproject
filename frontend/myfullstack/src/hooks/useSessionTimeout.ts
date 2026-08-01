import { useEffect, useRef } from "react";
import { handleSessionExpired } from "../services/sessionManager.ts";

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "touchstart", "click"] as const;

export const useSessionTimeout = (isAuthenticated: boolean, onTimeout?: () => void) => {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        handleSessionExpired("Your session has expired. Please log in again.");
        onTimeout?.();
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [isAuthenticated, onTimeout]);
};
