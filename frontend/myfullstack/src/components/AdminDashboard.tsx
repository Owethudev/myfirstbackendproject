import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types.ts";
import { authService } from "../services/authService.ts";

type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalPosts: number;
  totalComments: number;
};

const DEFAULT_STATS: AdminStats = {
  totalUsers: 0,
  verifiedUsers: 0,
  unverifiedUsers: 0,
  totalPosts: 0,
  totalComments: 0,
};

type AdminUser = {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  verified: boolean;
  suspended: boolean;
  createdAt?: string;
};

type ModerationPost = {
  _id: string;
  name: string;
  description: string;
  portfolio?: string;
  author?: string | null;
  reported?: boolean;
  reportReason?: string | null;
  moderationStatus?: string;
};

type AuditLogEntry = {
  _id: string;
  timestamp: string;
  userId?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string;
  method: string;
  path: string;
  statusCode?: number | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  query?: unknown;
  params?: unknown;
  body?: unknown;
};

type AdminResourceState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdminStats(value: unknown): value is AdminStats {
  return (
    isRecord(value) &&
    [
      "totalUsers",
      "verifiedUsers",
      "unverifiedUsers",
      "totalPosts",
      "totalComments",
    ].every(
      (key) =>
        typeof value[key] === "number" && Number.isFinite(value[key]),
    )
  );
}

function isAdminUser(value: unknown): value is AdminUser {
  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    (value.role === "user" || value.role === "admin") &&
    typeof value.verified === "boolean" &&
    typeof value.suspended === "boolean"
  );
}

function isModerationPost(value: unknown): value is ModerationPost {
  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    (value.author === undefined ||
      value.author === null ||
      typeof value.author === "string") &&
    (value.reportReason === undefined ||
      value.reportReason === null ||
      typeof value.reportReason === "string")
  );
}

function isAuditLogEntry(value: unknown): value is AuditLogEntry {
  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    typeof value.timestamp === "string" &&
    (value.userId === undefined ||
      value.userId === null ||
      typeof value.userId === "string") &&
    (value.username === undefined ||
      value.username === null ||
      typeof value.username === "string") &&
    (value.email === undefined ||
      value.email === null ||
      typeof value.email === "string") &&
    (value.role === undefined || typeof value.role === "string") &&
    typeof value.method === "string" &&
    typeof value.path === "string" &&
    (value.statusCode === undefined ||
      value.statusCode === null ||
      typeof value.statusCode === "number") &&
    (value.durationMs === undefined ||
      value.durationMs === null ||
      typeof value.durationMs === "number") &&
    (value.ipAddress === undefined ||
      value.ipAddress === null ||
      typeof value.ipAddress === "string")
  );
}

function isUserMutationResponse(
  value: unknown,
  userId: string,
): value is {
  user: {
    id: string;
    role: "user" | "admin";
    suspended: boolean;
    verified: boolean;
  };
} {
  return (
    isRecord(value) &&
    isRecord(value.user) &&
    value.user.id === userId &&
    (value.user.role === "user" || value.user.role === "admin") &&
    typeof value.user.suspended === "boolean" &&
    typeof value.user.verified === "boolean"
  );
}

function isMessageResponse(value: unknown): value is { message: string } {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    value.message.length > 0
  );
}

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem("snpl_user");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch (error) {
    console.error("failed reading local user", error);
    return null;
  }
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ModerationPost[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "users" | "reports" | "audit"
  >("overview");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [statsState, setStatsState] = useState<AdminResourceState>({
    status: "loading",
  });
  const [usersState, setUsersState] = useState<AdminResourceState>({
    status: "loading",
  });
  const [reportedPostsState, setReportedPostsState] =
    useState<AdminResourceState>({ status: "loading" });
  const [auditState, setAuditState] = useState<AdminResourceState>({
    status: "loading",
  });
  const [search, setSearch] = useState("");
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [actionError, setActionError] = useState("");
  const requestIds = useRef({ stats: 0, users: 0, reports: 0, audit: 0 });

  const loadStats = useCallback(async () => {
    const requestId = ++requestIds.current.stats;
    setStatsState({ status: "loading" });

    try {
      const data: unknown = await authService.fetchJson("/api/v1/users/stats");
      if (requestId !== requestIds.current.stats) return;
      if (!isAdminStats(data)) {
        throw new Error("Unable to load admin statistics: invalid response");
      }

      setStats(data);
      setStatsState({ status: "ready" });
    } catch (err) {
      if (requestId !== requestIds.current.stats) return;
      setStatsState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unable to load admin statistics",
      });
    }
  }, []);

  const loadUsers = useCallback(async (query: string) => {
    const requestId = ++requestIds.current.users;
    setUsersState({ status: "loading" });

    try {
      const data: unknown = await authService.fetchJson(
        `/api/v1/users/list?page=1&limit=20&search=${encodeURIComponent(query)}`,
      );
      if (requestId !== requestIds.current.users) return;
      if (
        !isRecord(data) ||
        !Array.isArray(data.items) ||
        !data.items.every(isAdminUser)
      ) {
        throw new Error("Unable to load users: invalid response");
      }

      setUsers(data.items);
      setUsersState({ status: "ready" });
    } catch (err) {
      if (requestId !== requestIds.current.users) return;
      setUsersState({
        status: "error",
        message: err instanceof Error ? err.message : "Unable to load users",
      });
    }
  }, []);

  const loadReportedPosts = useCallback(async () => {
    const requestId = ++requestIds.current.reports;
    setReportedPostsState({ status: "loading" });

    try {
      const data: unknown = await authService.fetchJson(
        "/api/v1/posts/reported?page=1&limit=20",
      );
      if (requestId !== requestIds.current.reports) return;
      if (
        !isRecord(data) ||
        !Array.isArray(data.items) ||
        !data.items.every(isModerationPost)
      ) {
        throw new Error("Unable to load reported posts: invalid response");
      }

      setReportedPosts(data.items);
      setReportedPostsState({ status: "ready" });
    } catch (err) {
      if (requestId !== requestIds.current.reports) return;
      setReportedPostsState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unable to load reported posts",
      });
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    const token = localStorage.getItem("snpl_token") || "";
    if (!token) {
      const timer = window.setTimeout(() => {
        setAccessError("Please log in again to access the dashboard.");
        setAccessLoading(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const currentRequestIds = requestIds.current;
    const timer = window.setTimeout(() => {
      setAccessError("");
      setAccessLoading(false);
      void loadStats();
      void loadUsers(search);
      void loadReportedPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      currentRequestIds.stats += 1;
      currentRequestIds.users += 1;
      currentRequestIds.reports += 1;
    };
  }, [loadReportedPosts, loadStats, loadUsers, navigate, search]);

  useEffect(() => {
    const currentRequestIds = requestIds.current;
    return () => {
      currentRequestIds.stats += 1;
      currentRequestIds.users += 1;
      currentRequestIds.reports += 1;
      currentRequestIds.audit += 1;
    };
  }, []);

  const handleToggleSuspend = async (userId: string, suspended: boolean) => {
    setActionError("");
    try {
      const data: unknown = await authService.fetchJson(
        `/api/v1/users/status/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ suspended: !suspended }),
        },
      );
      if (
        !isUserMutationResponse(data, userId) ||
        data.user.suspended !== !suspended
      ) {
        throw new Error("Unable to update user status: invalid response");
      }

      setUsers((current) =>
        current.map((item) =>
          item._id === userId
            ? {
                ...item,
                suspended: data.user.suspended,
                verified: data.user.verified,
                role: data.user.role,
              }
            : item,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update user status",
      );
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";

    setActionError("");
    try {
      const data: unknown = await authService.fetchJson(
        `/api/v1/users/role/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: nextRole }),
        },
      );
      if (!isUserMutationResponse(data, userId) || data.user.role !== nextRole) {
        throw new Error("Unable to update user role: invalid response");
      }

      setUsers((current) =>
        current.map((item) =>
          item._id === userId
            ? {
                ...item,
                role: data.user.role,
                suspended: data.user.suspended,
                verified: data.user.verified,
              }
            : item,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update user role",
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    setActionError("");
    try {
      const data: unknown = await authService.fetchJson("/api/v1/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!isMessageResponse(data)) {
        throw new Error("Unable to delete user: invalid response");
      }

      setUsers((current) => current.filter((item) => item._id !== userId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete user");
    }
  };

  const handleRemovePost = async (postId: string) => {
    const confirmed = window.confirm("Remove this post from the feed?");
    if (!confirmed) return;

    setActionError("");
    try {
      const data: unknown = await authService.fetchJson(
        `/api/v1/posts/admin-delete/${postId}`,
        {
          method: "DELETE",
        },
      );
      if (!isMessageResponse(data)) {
        throw new Error("Unable to remove post: invalid response");
      }

      setReportedPosts((current) =>
        current.filter((item) => item._id !== postId),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to remove post");
    }
  };

  const loadAuditLogs = useCallback(async () => {
    const requestId = ++requestIds.current.audit;
    setAuditState({ status: "loading" });

    try {
      const data: unknown = await authService.fetchJson(
        "/api/v1/audit?limit=100",
      );
      if (requestId !== requestIds.current.audit) return;

      if (
        !isRecord(data) ||
        data.success !== true ||
        !Array.isArray(data.data) ||
        !data.data.every(isAuditLogEntry)
      ) {
        throw new Error(
          isRecord(data) && typeof data.message === "string"
            ? data.message
            : "Unable to load audit logs: invalid response",
        );
      }

      setAuditLogs(data.data);
      setAuditState({ status: "ready" });
    } catch (err) {
      if (requestId !== requestIds.current.audit) return;
      setAuditState({
        status: "error",
        message: err instanceof Error ? err.message : "Unable to load audit logs",
      });
    }
  }, []);

  useEffect(() => {
    if (selectedTab !== "audit") {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadAuditLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAuditLogs, selectedTab]);

  return (
    <div className="admin-shell min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#EF476F]">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Dashboard Home</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-2 text-sm font-semibold text-[#2D1E2F]"
          >
            Back to app
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { label: "Overview", value: "overview" },
            { label: "User management", value: "users" },
            { label: "Reports", value: "reports" },
            { label: "Audit logs", value: "audit" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedTab(tab.value as typeof selectedTab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedTab === tab.value
                  ? "border bg-[#2D1E2F] text-white"
                  : "border border-[#2D1E2F]/10 bg-white text-[#2D1E2F]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {accessLoading ? (
          <p className="text-sm text-[#2D1E2F]/70" role="status">
            Loading dashboard…
          </p>
        ) : accessError ? (
          <div
            className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600"
            role="alert"
          >
            {accessError}
          </div>
        ) : (
          <>
            {actionError ? (
              <div
                className="mb-4 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600"
                role="alert"
              >
                {actionError}
              </div>
            ) : null}

            {selectedTab === "overview" && (
              <div className="mb-6">
                {statsState.status === "loading" ? (
                  <p className="text-sm text-[#2D1E2F]/70" role="status">
                    Loading dashboard statistics…
                  </p>
                ) : null}
                {statsState.status === "error" ? (
                  <div
                    className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600"
                    role="alert"
                  >
                    <p>{statsState.message}</p>
                    <button type="button" onClick={() => void loadStats()}>
                      Retry loading statistics
                    </button>
                  </div>
                ) : null}
                {statsState.status === "ready" ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[#2D1E2F]/60">
                        Total users
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[#2D1E2F]/60">
                        Verified users
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {stats.verifiedUsers}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[#2D1E2F]/60">
                        Unverified users
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {stats.unverifiedUsers}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[#2D1E2F]/60">
                        Total posts
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {stats.totalPosts}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[#2D1E2F]/60">
                        Total comments
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {stats.totalComments}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {selectedTab === "users" && (
              <div className="mb-6 rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">User management</h2>
                    <p className="text-sm text-[#2D1E2F]/60">
                      Search, suspend, and change roles.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users"
                    className="rounded-full border border-[#2D1E2F]/10 px-3 py-2 text-sm outline-none"
                  />
                </div>

                {usersState.status === "loading" ? (
                  <p className="text-sm text-[#2D1E2F]/70" role="status">
                    Loading users…
                  </p>
                ) : null}
                {usersState.status === "error" ? (
                  <div
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    <p>{usersState.message}</p>
                    <button
                      type="button"
                      onClick={() => void loadUsers(search)}
                    >
                      Retry loading users
                    </button>
                  </div>
                ) : null}
                {usersState.status === "ready" && users.length === 0 ? (
                  <p className="text-sm text-[#2D1E2F]/60">No users found.</p>
                ) : null}
                {usersState.status === "ready" && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#2D1E2F]/10 text-[#2D1E2F]/70">
                          <th className="px-2 py-2">User</th>
                          <th className="px-2 py-2">Role</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user._id}
                            className="border-b border-[#2D1E2F]/5"
                          >
                            <td className="px-2 py-3">
                              <div className="font-semibold">{user.username}</div>
                              <div className="text-xs text-[#2D1E2F]/60">
                                {user.email}
                              </div>
                            </td>
                            <td className="px-2 py-3">{user.role}</td>
                            <td className="px-2 py-3">
                              {user.suspended
                                ? "Suspended"
                                : user.verified
                                  ? "Active"
                                  : "Pending"}
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleSuspend(user._id, user.suspended)
                                  }
                                  className="rounded-full border border-[#2D1E2F]/10 px-3 py-1 text-xs font-semibold"
                                >
                                  {user.suspended ? "Reactivate" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRoleChange(user._id, user.role)
                                  }
                                  className="rounded-full border border-[#2D1E2F]/10 px-3 py-1 text-xs font-semibold"
                                >
                                  {user.role === "admin"
                                    ? "Make user"
                                    : "Make admin"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}

            {selectedTab === "reports" && (
              <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Content moderation</h2>
                  <p className="text-sm text-[#2D1E2F]/60">
                    Review reported posts and remove inappropriate content.
                  </p>
                </div>

                {reportedPostsState.status === "loading" ? (
                  <p className="text-sm text-[#2D1E2F]/70" role="status">
                    Loading reported content…
                  </p>
                ) : null}
                {reportedPostsState.status === "error" ? (
                  <div className="text-sm text-red-600" role="alert">
                    <p>{reportedPostsState.message}</p>
                    <button
                      type="button"
                      onClick={() => void loadReportedPosts()}
                    >
                      Retry loading reported content
                    </button>
                  </div>
                ) : null}
                {reportedPostsState.status === "ready" &&
                reportedPosts.length === 0 ? (
                  <p className="text-sm text-[#2D1E2F]/60">
                    No reported content at the moment.
                  </p>
                ) : null}
                {reportedPostsState.status === "ready" &&
                reportedPosts.length > 0 ? (
                  <div className="space-y-3">
                    {reportedPosts.map((post) => (
                      <div
                        key={post._id}
                        className="rounded-xl border border-[#2D1E2F]/10 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{post.name}</h3>
                            <p className="mt-1 text-sm text-[#2D1E2F]/70">
                              {post.description}
                            </p>
                            {post.reportReason ? (
                              <p className="mt-2 text-xs font-medium text-red-600">
                                Reason: {post.reportReason}
                              </p>
                            ) : null}
                            {post.author ? (
                              <p className="mt-1 text-xs text-[#2D1E2F]/60">
                                By {post.author}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePost(post._id)}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                          >
                            Remove post
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {selectedTab === "audit" && (
              <div className="rounded-2xl border border-[#2D1E2F]/10 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Audit logs</h2>
                    <p className="text-sm text-[#2D1E2F]/60">
                      Recent admin activity and request history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAuditLogs}
                    className="rounded-full border border-[#2D1E2F]/10 bg-white px-4 py-2 text-sm font-semibold text-[#2D1E2F]"
                  >
                    Refresh
                  </button>
                </div>
                {auditState.status === "loading" ? (
                  <p className="text-sm text-[#2D1E2F]/70" role="status">
                    Loading audit logs…
                  </p>
                ) : null}
                {auditState.status === "error" ? (
                  <div className="text-sm text-red-600" role="alert">
                    <p>{auditState.message}</p>
                    <button type="button" onClick={() => void loadAuditLogs()}>
                      Retry loading audit logs
                    </button>
                  </div>
                ) : null}
                {auditState.status === "ready" && auditLogs.length === 0 ? (
                  <p className="text-sm text-[#2D1E2F]/60">
                    No audit logs available.
                  </p>
                ) : null}
                {auditState.status === "ready" && auditLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#2D1E2F]/10 text-[#2D1E2F]/70">
                          <th className="px-2 py-2">Time</th>
                          <th className="px-2 py-2">User</th>
                          <th className="px-2 py-2">Action</th>
                          <th className="px-2 py-2">Path</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((entry) => (
                          <tr
                            key={entry._id}
                            className="border-b border-[#2D1E2F]/5"
                          >
                            <td className="px-2 py-3">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="px-2 py-3">
                              {entry.username ?? entry.email ?? "Guest"}
                            </td>
                            <td className="px-2 py-3">{entry.method}</td>
                            <td className="px-2 py-3 truncate max-w-[240px]">
                              {entry.path}
                            </td>
                            <td className="px-2 py-3">
                              {entry.statusCode ?? "-"}
                            </td>
                            <td className="px-2 py-3">
                              {entry.durationMs != null
                                ? `${entry.durationMs} ms`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
