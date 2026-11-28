import { useCallback, useRef, useState } from "react";
import { buildApiUrl, getApiErrorMessage, parseJsonResponse } from "../api.ts";
import type { FeedRequestState } from "../types.ts";

const FEED_CACHE_TTL_MS = 2 * 60 * 1000;
const FEED_CACHE_PREFIX = "snpl:public-feed:v1:";

type PaginatedResponse<T> = {
  currentPage: number;
  hasNextPage: boolean;
  items: T[];
};

type CachedFeed<T> = PaginatedResponse<T> & { savedAt: number };

const getFailureMessage = (payload: unknown, fallback: string) =>
  getApiErrorMessage(payload, fallback);

export function usePaginatedFeed<T extends { _id: string }>(
  endpoint: string,
  pageSize: number,
) {
  const cacheKey = `${FEED_CACHE_PREFIX}${endpoint}:limit:${pageSize}`;
  const cachedFeed = (() => {
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const cached = JSON.parse(raw) as Partial<CachedFeed<T>>;
      if (
        typeof cached.savedAt !== "number" ||
        Date.now() - cached.savedAt > FEED_CACHE_TTL_MS ||
        !Array.isArray(cached.items) ||
        cached.currentPage !== 1 ||
        typeof cached.hasNextPage !== "boolean"
      ) {
        window.sessionStorage.removeItem(cacheKey);
        return null;
      }
      return cached as CachedFeed<T>;
    } catch {
      return null;
    }
  })();
  const [items, setItems] = useState<T[]>(() => cachedFeed?.items ?? []);
  const [currentPage, setCurrentPage] = useState(cachedFeed?.currentPage ?? 1);
  const [hasNextPage, setHasNextPage] = useState(cachedFeed?.hasNextPage ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestState, setRequestState] = useState<FeedRequestState>(
    cachedFeed ? { status: "ready" } : { status: "loading" },
  );
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (page = 1, append = false) => {
      const currentRequestId = ++requestId.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingMore(false);
        setRequestState({ status: "loading" });
      }

      try {
        const response = await fetch(
          buildApiUrl(`${endpoint}?page=${page}&limit=${pageSize}`),
        );
        const data = await parseJsonResponse<PaginatedResponse<T> & { message?: string }>(
          response,
        );

        if (!response.ok) {
          throw new Error(
            getFailureMessage(data, "Unable to load community content. Please try again."),
          );
        }

        if (
          !Array.isArray(data.items) ||
          typeof data.currentPage !== "number" ||
          typeof data.hasNextPage !== "boolean"
        ) {
          throw new Error("Unable to load community content. Please try again.");
        }

        if (currentRequestId !== requestId.current) return;

        setItems((current) =>
          append ? [...current, ...data.items] : data.items,
        );
        setCurrentPage(data.currentPage);
        setHasNextPage(data.hasNextPage);
        setRequestState({ status: "ready" });
        if (page === 1) {
          try {
            window.sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ ...data, savedAt: Date.now() }),
            );
          } catch {
            // Storage can be disabled or full; the live feed still works.
          }
        }
      } catch (error) {
        if (currentRequestId !== requestId.current) return;

        setRequestState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load community content. Please try again.",
        });
      } finally {
        if (append && currentRequestId === requestId.current) {
          setLoadingMore(false);
        }
      }
    },
    [cacheKey, endpoint, pageSize],
  );

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item._id !== id));
  }, []);

  return {
    items,
    currentPage,
    hasNextPage,
    loadingMore,
    requestState,
    loadPage,
    removeItem,
  };
}
