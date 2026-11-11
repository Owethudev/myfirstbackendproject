import { useCallback, useRef, useState } from "react";
import { buildApiUrl, getApiErrorMessage, parseJsonResponse } from "../api.ts";
import type { FeedRequestState } from "../types.ts";

type PaginatedResponse<T> = {
  currentPage: number;
  hasNextPage: boolean;
  items: T[];
};

const getFailureMessage = (payload: unknown, fallback: string) =>
  getApiErrorMessage(payload, fallback);

export function usePaginatedFeed<T extends { _id: string }>(
  endpoint: string,
  pageSize: number,
) {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestState, setRequestState] = useState<FeedRequestState>({
    status: "loading",
  });
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
    [endpoint, pageSize],
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
