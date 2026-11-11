import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePaginatedFeed } from "./usePaginatedFeed";

type TestPost = { _id: string; name: string };

const createResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe("usePaginatedFeed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("distinguishes a successful empty result from a failed request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse(200, {
          currentPage: 1,
          hasNextPage: false,
          items: [],
        }),
      )
      .mockResolvedValueOnce(createResponse(503, { message: "Feed unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      usePaginatedFeed<TestPost>("/api/v1/posts/getPosts", 6),
    );

    await act(async () => {
      await result.current.loadPage();
    });
    expect(result.current.requestState).toEqual({ status: "ready" });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      await result.current.loadPage();
    });
    expect(result.current.requestState).toEqual({
      status: "error",
      message: "Feed unavailable",
    });
    expect(result.current.items).toEqual([]);
  });

  it("keeps the newest page response when an older request resolves last", async () => {
    const olderResponse = createDeferred<Response>();
    const newerResponse = createDeferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(olderResponse.promise)
      .mockReturnValueOnce(newerResponse.promise);
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      usePaginatedFeed<TestPost>("/api/v1/posts/getPosts", 6),
    );

    let olderRequest!: Promise<void>;
    let newerRequest!: Promise<void>;
    act(() => {
      olderRequest = result.current.loadPage();
      newerRequest = result.current.loadPage();
    });

    await act(async () => {
      newerResponse.resolve(
        createResponse(200, {
          currentPage: 1,
          hasNextPage: false,
          items: [{ _id: "newer", name: "Latest post" }],
        }),
      );
      await newerRequest;
    });
    await act(async () => {
      olderResponse.resolve(createResponse(503, { message: "Stale failure" }));
      await olderRequest;
    });

    expect(result.current.items).toEqual([{ _id: "newer", name: "Latest post" }]);
    expect(result.current.requestState).toEqual({ status: "ready" });
  });

  it("supports retrying a failed request without discarding existing feed data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse(200, {
          currentPage: 1,
          hasNextPage: false,
          items: [{ _id: "existing", name: "Existing post" }],
        }),
      )
      .mockResolvedValueOnce(createResponse(503, { message: "Temporary failure" }))
      .mockResolvedValueOnce(
        createResponse(200, {
          currentPage: 1,
          hasNextPage: false,
          items: [{ _id: "recovered", name: "Recovered post" }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      usePaginatedFeed<TestPost>("/api/v1/posts/getPosts", 6),
    );

    await act(async () => {
      await result.current.loadPage();
    });
    await act(async () => {
      await result.current.loadPage();
    });
    expect(result.current.items).toEqual([{ _id: "existing", name: "Existing post" }]);
    expect(result.current.requestState.status).toBe("error");

    await act(async () => {
      await result.current.loadPage();
    });

    await waitFor(() => {
      expect(result.current.requestState).toEqual({ status: "ready" });
    });
    expect(result.current.items).toEqual([{ _id: "recovered", name: "Recovered post" }]);
  });

  it("preserves loaded items and page metadata when loading more fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse(200, {
          currentPage: 1,
          hasNextPage: true,
          items: [{ _id: "existing", name: "Existing post" }],
        }),
      )
      .mockResolvedValueOnce(createResponse(503, { message: "Next page unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      usePaginatedFeed<TestPost>("/api/v1/posts/getPosts", 6),
    );

    await act(async () => {
      await result.current.loadPage();
    });
    await act(async () => {
      await result.current.loadPage(2, true);
    });

    expect(result.current.items).toEqual([{ _id: "existing", name: "Existing post" }]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.requestState).toEqual({
      status: "error",
      message: "Next page unavailable",
    });
  });
});
