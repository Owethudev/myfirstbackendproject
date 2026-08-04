import { useEffect, useState } from "react";
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
  author?: string;
  reported?: boolean;
  reportReason?: string | null;
  moderationStatus?: string;
};

type AuditLogEntry = {
  _id: string;
  timestamp: string;
  userId: string | null;
  username: string | null;
  email: string | null;
  role: string;
  method: string;
  path: string;
  statusCode: number | null;
  durationMs: number | null;
  ipAddress: string | null;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  body: Record<string, unknown>;
};

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
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    const token = localStorage.getItem("snpl_token") || "";
    if (!token) {
      const timer = window.setTimeout(() => {
        setError("Please log in again to access the dashboard.");
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const loadStats = async () => {
      try {
        const data = await authService.fetchJson("/api/v1/users/stats");
        setStats(data as AdminStats);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load admin statistics",
        );
      }
    };

    const loadUsers = async () => {
      try {
        const data = await authService.fetchJson(
          `/api/v1/users/list?page=1&limit=20&search=${encodeURIComponent(search)}`,
        );

        const responseItems = (data as { items?: unknown[] }).items ?? [];
        setUsers(
          Array.isArray(responseItems) ? (responseItems as AdminUser[]) : [],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load users");
      }
    };

    const loadReportedPosts = async () => {
      try {
        const data = await authService.fetchJson(
          "/api/v1/posts/reported?page=1&limit=20",
        );

        const responseItems = (data as { items?: unknown[] }).items ?? [];
        setReportedPosts(
          Array.isArray(responseItems)
            ? (responseItems as ModerationPost[])
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load reported posts",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
    void loadUsers();
    void loadReportedPosts();
  }, [navigate, search]);

  const handleToggleSuspend = async (userId: string, suspended: boolean) => {
    try {
      await authService.fetchJson(`/api/v1/users/status/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suspended: !suspended }),
      });

      setUsers((current) =>
        current.map((item) =>
          item._id === userId ? { ...item, suspended: !suspended } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user status",
      );
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";

    try {
      await authService.fetchJson(`/api/v1/users/role/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });

      setUsers((current) =>
        current.map((item) =>
          item._id === userId ? { ...item, role: nextRole } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user role",
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    try {
      await authService.fetchJson("/api/v1/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId }),
      });

      setUsers((current) => current.filter((item) => item._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user");
    }
  };

  const handleRemovePost = async (postId: string) => {
    const confirmed = window.confirm("Remove this post from the feed?");
    if (!confirmed) return;

    try {
      await authService.fetchJson(`/api/v1/posts/admin-delete/${postId}`, {
        method: "DELETE",
      });

      setReportedPosts((current) =>
        current.filter((item) => item._id !== postId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove post");
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    setError("");

    try {
      const data = (await authService.fetchJson("/api/v1/audit?limit=100")) as {
        success?: boolean;
        data?: AuditLogEntry[];
        message?: string;
      };

      if (!data.success) {
        throw new Error(data.message || "Unable to load audit logs");
      }

      setAuditLogs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load audit logs",
      );
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (selectedTab !== "audit") {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadAuditLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedTab]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 text-[#2D1E2F]">
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

        {loading ? (
          <p className="text-sm text-[#2D1E2F]/70">Loading dashboard…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            {selectedTab === "overview" && (
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

                {reportedPosts.length === 0 ? (
                  <p className="text-sm text-[#2D1E2F]/60">
                    No reported content at the moment.
                  </p>
                ) : (
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
                )}
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
                {loadingAudit ? (
                  <p className="text-sm text-[#2D1E2F]/70">
                    Loading audit logs…
                  </p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-[#2D1E2F]/60">
                    No audit logs available.
                  </p>
                ) : (
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
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
