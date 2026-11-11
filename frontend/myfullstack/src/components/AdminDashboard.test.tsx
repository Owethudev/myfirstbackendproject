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

type DashboardOptions = {
  loadStats?: () => Promise<unknown>;
  loadReportedPosts?: () => Promise<unknown>;
  loadAuditLogs?: () => Promise<unknown>;
  mutations?: Map<
    string,
    (options?: RequestInit) => Promise<unknown>
  >;
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

const mountDashboard = async (
  requests: Map<string, ReturnType<typeof createDeferred<UserListResponse>>>,
  options: DashboardOptions = {},
) => {
  localStorage.setItem(
    "snpl_user",
    JSON.stringify({ id: "admin-1", username: "admin", role: "admin" }),
  );
  localStorage.setItem("snpl_token", "test-token");

  fetchJsonMock.mockImplementation((path: string, requestOptions?: RequestInit) => {
    if (path === "/api/v1/users/stats") {
      return (
        options.loadStats?.() ??
        Promise.resolve({
          totalUsers: 0,
          verifiedUsers: 0,
          unverifiedUsers: 0,
          totalPosts: 0,
          totalComments: 0,
        })
      );
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
      return options.loadReportedPosts?.() ?? Promise.resolve({ items: [] });
    }

    if (path === "/api/v1/audit?limit=100") {
      return (
        options.loadAuditLogs?.() ??
        Promise.resolve({ success: true, data: [] })
      );
    }

    const mutation = options.mutations?.get(path);
    if (mutation) {
      return mutation(requestOptions);
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
    vi.restoreAllMocks();
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

  it("keeps statistics, users, and reports independent and retries failed resources", async () => {
    const userRequests = new Map([
      ["", createDeferred<UserListResponse>()],
    ]);
    const loadStats = vi
      .fn()
      .mockRejectedValueOnce(new Error("Statistics unavailable"))
      .mockResolvedValueOnce({
        totalUsers: 42,
        verifiedUsers: 30,
        unverifiedUsers: 12,
        totalPosts: 8,
        totalComments: 0,
      });
    const loadReportedPosts = vi
      .fn()
      .mockRejectedValueOnce(new Error("Reports unavailable"))
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ items: [] });
    await mountDashboard(userRequests, {
      loadStats,
      loadReportedPosts,
    });

    userRequests.get("")?.reject(new Error("Users unavailable"));
    expect(await screen.findByText("Users unavailable")).toBeInTheDocument();
    userRequests.set("", createDeferred<UserListResponse>());
    fireEvent.click(screen.getByRole("button", { name: "Retry loading users" }));
    await waitFor(() => {
      expect(
        fetchJsonMock.mock.calls.filter(
          ([path]) => path === "/api/v1/users/list?page=1&limit=20&search=",
        ),
      ).toHaveLength(2);
    });
    await act(async () => {
      userRequests
        .get("")
        ?.resolve({ items: [makeUser("user-1", "available-user")] });
    });
    expect(await screen.findByText("available-user")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByText("Statistics unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Total users")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading statistics" }),
    );
    expect(await screen.findByText("42")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    expect(await screen.findByText("Reports unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText("No reported content at the moment."),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading reported content" }),
    );
    expect(
      await screen.findByText("Unable to load reported posts: invalid response"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No reported content at the moment."),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading reported content" }),
    );
    expect(
      await screen.findByText("No reported content at the moment."),
    ).toBeInTheDocument();
  });

  it("does not present a failed admin mutation as successful", async () => {
    const userRequest = createDeferred<UserListResponse>();
    const requests = new Map([["", userRequest]]);
    const statusPath = "/api/v1/users/status/user-1";
    const updateStatus = vi
      .fn()
      .mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          suspended: false,
          verified: true,
        },
      })
      .mockResolvedValueOnce({
        message: "User suspended successfully",
        user: {
          id: "user-1",
          role: "user",
          suspended: true,
          verified: true,
        },
      });
    const mutationResponses = new Map([[statusPath, updateStatus]]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await mountDashboard(requests, { mutations: mutationResponses });
    await act(async () => {
      userRequest.resolve({ items: [makeUser("user-1", "member")] });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Suspend" }));
    expect(
      await screen.findByText("Unable to update user status: invalid response"),
    ).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(await screen.findByText("Suspended")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument();
  });

  it("deletes an admin-selected user using the email contract", async () => {
    const userRequest = createDeferred<UserListResponse>();
    const requests = new Map([["", userRequest]]);
    const deletePath = "/api/v1/users/delete";
    let deleteBody: unknown;
    const deleteUser = vi.fn(async (requestOptions?: RequestInit) => {
      deleteBody = JSON.parse(String(requestOptions?.body));
      return { message: "User deleted successfully" };
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await mountDashboard(requests, {
      mutations: new Map([[deletePath, deleteUser]]),
    });
    await act(async () => {
      userRequest.resolve({ items: [makeUser("user-1", "member")] });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledOnce();
      expect(deleteBody).toEqual({ email: "member@example.test" });
      expect(screen.queryByText("member")).toBeNull();
    });
  });

  it("distinguishes audit-log request errors from a successful empty result", async () => {
    const requests = new Map([["", createDeferred<UserListResponse>()]]);
    const loadAuditLogs = vi
      .fn()
      .mockRejectedValueOnce(new Error("Audit service unavailable"))
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            _id: "audit-1",
            timestamp: "2026-11-11T12:00:00.000Z",
            userId: "admin-1",
            username: "admin",
            email: "admin@example.test",
            role: "admin",
            method: "GET",
            path: "/api/v1/users/stats",
            statusCode: 200,
            durationMs: 12,
            ipAddress: "127.0.0.1",
            query: {},
            params: {},
            body: {},
          },
        ],
      });
    await mountDashboard(requests, { loadAuditLogs });

    fireEvent.click(screen.getByRole("button", { name: "Audit logs" }));
    expect(await screen.findByText("Audit service unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No audit logs available.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading audit logs" }));
    expect(await screen.findByText("No audit logs available.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("/api/v1/users/stats")).toBeInTheDocument();
  });
});
