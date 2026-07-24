import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types.ts";
import { buildApiUrl } from "../api.ts";

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/v1/users/stats"), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load admin statistics");
        }

        setStats(data);
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
        const response = await fetch(
          buildApiUrl(
            `/api/v1/users/list?search=${encodeURIComponent(search)}`,
          ),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
            },
          },
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load users");
        }

        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load users");
      }
    };

    const loadReportedPosts = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/v1/posts/reported"), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load reported posts");
        }

        setReportedPosts(data);
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
      const response = await fetch(
        buildApiUrl(`/api/v1/users/status/${userId}`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
          },
          body: JSON.stringify({ suspended: !suspended }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update user status");
      }

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
      const response = await fetch(
        buildApiUrl(`/api/v1/users/role/${userId}`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
          },
          body: JSON.stringify({ role: nextRole }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update user role");
      }

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
      const response = await fetch(buildApiUrl("/api/v1/users/delete"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
        },
        body: JSON.stringify({ id: userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete user");
      }

      setUsers((current) => current.filter((item) => item._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user");
    }
  };

  const handleRemovePost = async (postId: string) => {
    const confirmed = window.confirm("Remove this post from the feed?");
    if (!confirmed) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/posts/admin-delete/${postId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("snpl_token") || ""}`,
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to remove post");
      }

      setReportedPosts((current) =>
        current.filter((item) => item._id !== postId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove post");
    }
  };

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

        {loading ? (
          <p className="text-sm text-[#2D1E2F]/70">Loading dashboard…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
