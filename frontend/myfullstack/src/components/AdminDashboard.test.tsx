import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

vi.mock("../services/authService.ts", () => ({
  authService: {
    fetchJson: fetchJsonMock,
  },
}));

type UserListResponse = {
  items: Array<{
    _id: string;
    username: string;
    email: string;
    role: "user" | "admin";
    verified: boolean;
    suspended: boolean;
  }>;
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const makeUser = (id: string, username: string) => ({
  _id: id,
  username,
  email: `${username}@example.test`,
  role: "user" as const,
  verified: true,
  suspended: false,
});

const mountDashboard = async (requests: Map<string, ReturnType<typeof createDeferred<UserListResponse>>>) => {
  localStorage.setItem(
    "snpl_user",
    JSON.stringify({ id: "admin-1", username: "admin", role: "admin" }),
  );
  localStorage.setItem("snpl_token", "test-token");

  fetchJsonMock.mockImplementation((path: string) => {
    if (path === "/api/v1/users/stats") {
      return Promise.resolve({
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        totalPosts: 0,
        totalComments: 0,
      });
    }

    if (path.startsWith("/api/v1/users/list")) {
      const search = new URLSearchParams(path.split("?")[1]).get("search") ?? "";
      const request = requests.get(search);
      if (!request) {
        throw new Error(`Unexpected user search: ${search}`);
      }
      return request.promise;
    }

    if (path === "/api/v1/posts/reported?page=1&limit=20") {
      return Promise.resolve({ items: [] });
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(fetchJsonMock).toHaveBeenCalledWith("/api/v1/users/list?page=1&limit=20&search=");
  });
  fireEvent.click(await screen.findByRole("button", { name: "User management" }));

  return screen.getByPlaceholderText("Search users");
};

describe("AdminDashboard user search", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the newest user results when an earlier search resolves later", async () => {
    const requests = new Map([
      ["", createDeferred<UserListResponse>()],
      ["stale", createDeferred<UserListResponse>()],
      ["latest", createDeferred<UserListResponse>()],
    ]);
    const searchInput = await mountDashboard(requests);

    fireEvent.change(searchInput, { target: { value: "stale" } });
    fireEvent.change(searchInput, { target: { value: "latest" } });

    await act(async () => {
      requests.get("latest")?.resolve({ items: [makeUser("latest-id", "latest-user")] });
      await requests.get("latest")?.promise;
    });
    expect(await screen.findByText("latest-user")).toBeInTheDocument();

    await act(async () => {
      requests.get("")?.resolve({ items: [] });
      requests.get("stale")?.resolve({ items: [makeUser("stale-id", "stale-user")] });
      await Promise.all([requests.get("")?.promise, requests.get("stale")?.promise]);
    });

    expect(screen.getByText("latest-user")).toBeInTheDocument();
    expect(screen.queryByText("stale-user")).not.toBeInTheDocument();
  });

  it("does not show an error from an obsolete search", async () => {
    const requests = new Map([
      ["", createDeferred<UserListResponse>()],
      ["stale", createDeferred<UserListResponse>()],
      ["latest", createDeferred<UserListResponse>()],
    ]);
    const searchInput = await mountDashboard(requests);

    fireEvent.change(searchInput, { target: { value: "stale" } });
    fireEvent.change(searchInput, { target: { value: "latest" } });

    await act(async () => {
      requests.get("latest")?.resolve({ items: [makeUser("latest-id", "latest-user")] });
      await requests.get("latest")?.promise;
    });
    expect(await screen.findByText("latest-user")).toBeInTheDocument();

    await act(async () => {
      requests.get("")?.resolve({ items: [] });
      requests.get("stale")?.reject(new Error("Obsolete search failed"));
      await requests.get("")?.promise;
      await requests.get("stale")?.promise.catch(() => undefined);
    });

    expect(screen.getByText("latest-user")).toBeInTheDocument();
    expect(screen.queryByText("Obsolete search failed")).not.toBeInTheDocument();
  });
});
