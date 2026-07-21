import { type FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  LogOut,
  Menu,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { VITE_API_BASE_URL } from "./config.ts";

type AuthMode = "login" | "signup";

type UserProfile = {
  id: string;
  username: string;
  email: string;
};

type PostItem = {
  _id: string;
  name: string;
  description: string;
  age: number;
  portfolio: string;
  author?: string;
  likes?: number;
  comments?: Array<{ text: string; author: string; createdAt?: string }>;
  createdAt?: string;
};

const API_BASE_URL = VITE_API_BASE_URL ?? "/api";
const buildApiUrl = (path: string) =>
  `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

const classmates = [
  "Owethu Jezile",
  "Malebo Nkuna",
  "Portia Mashaba",
  "Sijabulile Ncube",
  "Shaun Maselela",
  "Refilwe Segoe",
  "Lesedi Modikwe",
  "Bheki Buthelezi",
  "Gareth Motloutsi",
  "Thami Sithole",
  "Qiyaam Moodley",
  "Galaletsang Modise",
  "Lerato Thungo",
  "Mhlengi Ngwenya",
  "David Ndlovu",
  "Noluthando Molui",
  "Tswarelo Madonsela",
  "Nyiko Vumani",
  "Mpho Mangena",
  "Elias Mtisie",
  "Mandla Sikhosana",
  "Thandokuhle Maphanga",
  "Bao Kekana",
  "Kabelo Mathapo",
];

const marqueeItems = [...classmates, ...classmates];

function AppShell() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postForm, setPostForm] = useState({
    name: "",
    description: "",
    portfolio: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  // comments removed from UI — keep no draft state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // persist user across page refreshes
  useEffect(() => {
    try {
      const raw = localStorage.getItem("snpl_user");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error("failed reading local user", e);
    }
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch(buildApiUrl("/api/v1/posts/getPosts"));
      const data = await response.json();
      if (response.ok) {
        setPosts(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user) {
      void loadPosts();
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const endpoint =
      mode === "login"
        ? buildApiUrl("/api/v1/users/login")
        : buildApiUrl("/api/v1/users/register");
    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            username: form.username,
            email: form.email,
            password: form.password,
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setUser(data.user);
      // persist logged-in user so refresh doesn't log out
      try {
        localStorage.setItem("snpl_user", JSON.stringify(data.user));
      } catch (e) {
        console.error("failed persisting user", e);
      }
      setProfileForm({
        username: data.user.username,
        email: data.user.email,
        password: "",
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/posts/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: postForm.name,
          description: postForm.description,
          age: 0,
          portfolio: postForm.portfolio,
          author: user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      setPostForm({ name: "", description: "", portfolio: "" });
      await loadPosts();
      setMessage(data.message || "Post created successfully");
    } catch (error) {
      console.error("handlePostSubmit error:", error);
      setMessage(
        error instanceof Error ? error.message : "Unable to create post",
      );
    }
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/users/update"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          username: profileForm.username || undefined,
          email: profileForm.email || undefined,
          password: profileForm.password || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      setUser(data.user);
      setProfileForm({
        username: data.user.username,
        email: data.user.email,
        password: "",
      });
      setIsEditingProfile(false);
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Profile update failed",
      );
    }
  };

  const handleLogout = async () => {
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/users/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Logout failed");
      }

      setUser(null);
      try {
        localStorage.removeItem("snpl_user");
      } catch (e) {
        /* ignore */
      }
      setForm({ username: "", email: "", password: "" });
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logout failed");
    }
  };

  // like feature removed

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete this post? This action cannot be undone.",
    );
    if (!confirmed) return;
    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/posts/delete/${postId}`),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      // remove post from local state
      setPosts((current) => current.filter((p) => p._id !== postId));
      setMessage(data.message || "Post deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  // comments removed from UI

  const handleDeleteProfile = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile?",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/users/delete"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setUser(null);
      try {
        localStorage.removeItem("snpl_user");
      } catch (e) {
        /* ignore */
      }
      setMessage(data.message);
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0) {
      const touchY = event.touches[0]?.clientY ?? 0;
      setPullDistance(touchY);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY !== 0) return;
    const touchY = event.touches[0]?.clientY ?? 0;
    const delta = touchY - pullDistance;
    setPullDistance(Math.max(0, Math.min(delta, 120)));
  };

  const handleTouchEnd = () => {
    if (pullDistance > 90) {
      setIsRefreshing(true);
      void loadPosts();
      window.setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 700);
      return;
    }
    setPullDistance(0);
  };

  const getCoverStyle = (name: string) => {
    const base = (name.charCodeAt(0) + name.length * 17) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${base} 85% 94%), hsl(${(base + 42) % 360} 80% 72%))`,
    };
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2D1E2F]">
      <header className="sticky top-0 z-30 border-b border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#EF476F]">
              SNPL PORT
            </p>
            <h1 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#2D1E2F] sm:text-3xl">
              {user
                ? `WELCOME, ${user.username.toUpperCase()}`
                : "CLASSROOM PORTFOLIO"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 p-2 text-[#2D1E2F] transition hover:bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#EF476F]/40"
                onClick={() => setIsProfileMenuOpen(true)}
                aria-label="Open profile menu"
              >
                <Menu size={20} />
              </button>
            ) : null}
            <div className="rounded-full border border-[#2D1E2F]/10 bg-[#F9B208]/20 px-3 py-2 text-sm font-medium text-[#2D1E2F]">
              {user ? "Live feed" : "Community ready"}
            </div>
          </div>
        </div>
      </header>

      <main
        className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!user ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="glass-card overflow-hidden rounded-[2rem] border border-[#2D1E2F]/10 p-5 shadow-[0_20px_60px_rgba(45,30,47,0.16)] sm:p-7"
            >
              <h2 className="mt-5 font-['Bebas_Neue'] text-5xl leading-none text-[#2D1E2F] sm:text-6xl">
                SHOW YOUR WORK.
                <br />
                GROW TOGETHER.
                <br />
                BUILD TOGETHER.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#2D1E2F]/80 sm:text-base">
                A warm, editorial home for your cohort to share polished work,
                discover fresh ideas, and celebrate each other with the energy
                of a real creative studio.
              </p>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#3D5A40]">
                  <Compass size={14} />
                  SNPL community
                </div>
                <div
                  className="conveyor-track flex w-max gap-3"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                  style={{
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                >
                  {marqueeItems.map((name, index) => (
                    <span
                      key={`${name}-${index}`}
                      className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-2 text-sm font-semibold text-[#2D1E2F] shadow-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="glass-card rounded-[2rem] border border-[#2D1E2F]/10 p-5 shadow-[0_20px_60px_rgba(45,30,47,0.16)] sm:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
                    Sign in
                  </p>
                  <h3 className="mt-1 font-['Bebas_Neue'] text-3xl text-[#2D1E2F]">
                    {mode === "login" ? "WELCOME BACK" : "JOIN THE ROOM"}
                  </h3>
                </div>
                <div className="rounded-full bg-[#F9B208]/20 p-3 text-[#FF6B35]">
                  <Sparkles size={20} />
                </div>
              </div>

              <div className="mt-5 flex rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/70 p-1">
                {(["login", "signup"] as AuthMode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === option
                        ? "bg-[#2D1E2F] text-[#FFF8F0] shadow"
                        : "text-[#2D1E2F]/70"
                    }`}
                    onClick={() => setMode(option)}
                  >
                    {option === "login" ? "Login" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                {mode === "signup" && (
                  <label className="block text-sm font-medium text-[#2D1E2F]/80">
                    <span className="mb-2 block">Username</span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(event) =>
                        setForm({ ...form, username: event.target.value })
                      }
                      className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      placeholder="Name"
                      required
                    />
                  </label>
                )}

                <label className="block text-sm font-medium text-[#2D1E2F]/80">
                  <span className="mb-2 block">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                    placeholder="you@class.com"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-[#2D1E2F]/80">
                  <span className="mb-2 block">Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                    placeholder="••••••"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EF476F] px-4 py-3 font-semibold text-[#FFF8F0] shadow-[0_12px_35px_rgba(239,71,111,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? "Working..."
                    : mode === "login"
                      ? "Login"
                      : "Sign up"}
                  <Send size={16} />
                </button>
              </form>

              {message ? (
                <p className="mt-4 rounded-2xl border border-[#F9B208]/30 bg-[#F9B208]/10 px-4 py-3 text-sm text-[#2D1E2F]">
                  {message}
                </p>
              ) : null}
            </motion.section>
          </div>
        ) : (
          <>
            <motion.aside
              initial={false}
              animate={{ x: isProfileMenuOpen ? 0 : "-110%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="fixed inset-y-0 left-0 z-40 w-[90vw] max-w-sm overflow-y-auto border-r border-[#2D1E2F]/10 bg-[#FFF8F0]/95 p-5 shadow-[24px_0_60px_rgba(45,30,47,0.18)] backdrop-blur md:w-[360px]"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
                    Profile
                  </p>
                  <h2 className="mt-1 font-['Bebas_Neue'] text-3xl text-[#2D1E2F]">
                    {user.username}
                  </h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] p-2 text-[#2D1E2F] transition hover:bg-[#F9F5EE]"
                  onClick={() => setIsProfileMenuOpen(false)}
                  aria-label="Close profile drawer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4 text-sm text-[#2D1E2F]">
                  <p className="font-semibold">Email</p>
                  <p className="text-[#2D1E2F]/70">{user.email}</p>
                </div>

                <div className="space-y-3 rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#2D1E2F]">
                      Profile actions
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-3 py-2 text-sm font-semibold text-[#2D1E2F]"
                      onClick={() => setIsEditingProfile((value) => !value)}
                    >
                      {isEditingProfile ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  {isEditingProfile ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-3">
                      <input
                        placeholder="New username"
                        value={profileForm.username}
                        onChange={(event) =>
                          setProfileForm({
                            ...profileForm,
                            username: event.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      />
                      <input
                        placeholder="New email"
                        type="email"
                        value={profileForm.email}
                        onChange={(event) =>
                          setProfileForm({
                            ...profileForm,
                            email: event.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      />
                      <input
                        placeholder="New password"
                        type="password"
                        value={profileForm.password}
                        onChange={(event) =>
                          setProfileForm({
                            ...profileForm,
                            password: event.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-[#2D1E2F] px-4 py-3 font-semibold text-[#FFF8F0]"
                      >
                        Save profile
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-[#EF476F]/20 bg-[#EF476F]/10 px-4 py-3 text-sm font-semibold text-[#EF476F]"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit profile
                    </button>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4">
                  <p className="mb-3 text-sm font-semibold text-[#2D1E2F]">
                    Post a project
                  </p>
                  <form onSubmit={handlePostSubmit} className="space-y-3">
                    <input
                      placeholder="Project title"
                      value={postForm.name}
                      onChange={(event) =>
                        setPostForm({ ...postForm, name: event.target.value })
                      }
                      className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      required
                    />
                    <textarea
                      placeholder="Short project description"
                      value={postForm.description}
                      onChange={(event) =>
                        setPostForm({
                          ...postForm,
                          description: event.target.value,
                        })
                      }
                      className="min-h-24 w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      required
                    />
                    <input
                      placeholder="Portfolio link"
                      value={postForm.portfolio}
                      onChange={(event) =>
                        setPostForm({
                          ...postForm,
                          portfolio: event.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                      required
                    />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-4 py-3 font-semibold text-[#FFF8F0]"
                    >
                      Publish project
                      <Send size={16} />
                    </button>
                  </form>
                  {message ? (
                    <p className="mt-3 rounded-2xl border border-[#F9B208]/30 bg-[#F9B208]/10 px-4 py-2 text-sm text-[#2D1E2F]">
                      {message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 font-semibold text-[#2D1E2F]"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EF476F]/20 bg-[#EF476F]/10 px-4 py-3 font-semibold text-[#EF476F]"
                    onClick={handleDeleteProfile}
                  >
                    <Trash2 size={16} />
                    Delete profile
                  </button>
                </div>
              </div>
            </motion.aside>

            {isProfileMenuOpen ? (
              <button
                type="button"
                className="fixed inset-0 z-30 bg-[#1F1B24]/40"
                onClick={() => setIsProfileMenuOpen(false)}
                aria-label="Close profile menu"
              />
            ) : null}

            <motion.section
              id="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/75 p-4 shadow-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#EF476F]">
                    Community feed
                  </p>
                  <h2 className="mt-1 font-['Bebas_Neue'] text-2xl text-[#2D1E2F]">
                    EDITORIAL SHOWCASE
                  </h2>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-3 py-2 text-sm font-semibold text-[#2D1E2F]"
                  onClick={() => void loadPosts()}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#2D1E2F]/20 bg-[#FFF8F0]/70 p-6 text-center text-sm text-[#2D1E2F]/70">
                  No posts yet. Be the first to share a project and spark the
                  feed.
                </div>
              ) : (
                posts.map((post) => (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-[1.75rem] border border-[#2D1E2F]/10 bg-[#FFF8F0] shadow-[0_16px_50px_rgba(45,30,47,0.10)]"
                  >
                    <div
                      className="flex min-h-36 items-end justify-between px-5 py-5 text-[#2D1E2F]"
                      style={getCoverStyle(post.name)}
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2D1E2F]/70">
                          {post.author ? post.author.toUpperCase() : "CREATOR"}
                        </p>
                        <h3 className="mt-2 font-['Bebas_Neue'] text-3xl leading-none">
                          {post.name}
                        </h3>
                      </div>
                      {/* age badge removed per design */}
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#2D1E2F]">
                            {post.name}
                          </p>
                          <p className="text-sm text-[#2D1E2F]/70">
                            Creator • {post.author ?? "Unknown"}
                          </p>
                        </div>
                        <div className="rounded-full bg-[#EF476F]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#EF476F]">
                          UI / Frontend
                        </div>
                      </div>

                      <p className="text-sm leading-6 text-[#2D1E2F]/80">
                        {post.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {[
                          "React",
                          "TypeScript",
                          "Framer Motion",
                          "Tailwind",
                        ].map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-3 py-1 text-xs font-semibold text-[#2D1E2F]"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <a
                        href={post.portfolio}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-semibold text-[#3D5A40] underline-offset-4 hover:underline"
                      >
                        Open portfolio by {post.author ?? "Creator"} →
                      </a>

                      <div className="flex items-center justify-between gap-2 border-t border-[#2D1E2F]/10 pt-4">
                        <div className="flex gap-2">
                          {/* likes and comments removed */}
                        </div>
                        {user && post.author === user.username ? (
                          <button
                            type="button"
                            className="ml-2 rounded-full border p-2.5 text-[#EF476F] transition hover:-translate-y-0.5"
                            onClick={() => void handleDeletePost(post._id)}
                            aria-label="Delete post"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>

                      {/* comments removed from post view */}
                    </div>
                  </motion.article>
                ))
              )}
            </motion.section>
          </>
        )}
      </main>

      {user ? (
        <nav className="sticky bottom-3 z-20 mx-auto mb-5 flex max-w-md items-center justify-center rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-3 py-2 shadow-[0_16px_50px_rgba(45,30,47,0.14)] backdrop-blur">
          <a
            href="#feed"
            className="rounded-full bg-[#EF476F] px-6 py-2 text-sm font-semibold text-[#FFF8F0]"
          >
            Feed
          </a>
        </nav>
      ) : null}

      {isRefreshing ? (
        <div className="fixed inset-x-0 top-16 z-40 flex justify-center">
          <div className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-3 py-2 text-sm font-semibold text-[#2D1E2F] shadow-sm">
            Refreshing the feed…
          </div>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
