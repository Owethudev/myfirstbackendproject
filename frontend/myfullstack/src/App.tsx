import {
  type FormEvent,
  type TouchEvent,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ArrowUp } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthView } from "./components/AuthView.tsx";
import { EventFeed } from "./components/EventFeed.tsx";
import { Feed } from "./components/Feed.tsx";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage.tsx";
import { Header } from "./components/Header.tsx";
import { ProfileDrawer } from "./components/ProfileDrawer.tsx";
import { ResetPasswordPage } from "./components/ResetPasswordPage.tsx";
import { buildApiUrl, getApiErrorMessage, parseJsonResponse } from "./api.ts";
import { authService } from "./services/authService.ts";
import {
  clearAuthState,
  getSessionMessage,
  getStoredUser,
} from "./services/sessionManager.ts";
import { useAuth } from "./hooks/useAuth.ts";
import { useSessionTimeout } from "./hooks/useSessionTimeout.ts";
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard.tsx").then((module) => ({
    default: module.AdminDashboard,
  })),
);
import type {
  AuthForm,
  AuthMode,
  EventForm,
  EventItem,
  PostForm,
  PostItem,
} from "./types.ts";

const EMPTY_AUTH_FORM: AuthForm = {
  username: "",
  email: "",
  password: "",
};

const EMPTY_POST_FORM: PostForm = {
  name: "",
  description: "",
  portfolio: "",
};

const EMPTY_EVENT_FORM: EventForm = {
  name: "",
  location: "",
  theme: "",
  time: "",
};

type PaginatedResponse<T> = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  items: T[];
};

function AppShell() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthForm>(EMPTY_AUTH_FORM);
  const { user, token, message, signOut, setMessage } = useAuth();
  const [localMessage, setLocalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [postForm, setPostForm] = useState<PostForm>(EMPTY_POST_FORM);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT_FORM);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFeed, setActiveFeed] = useState<"projects" | "events">(
    "projects",
  );
  const [feedLayout, setFeedLayout] = useState<"current" | "grid">("current");
  const [postPage, setPostPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState<"projects" | "events">(
    "projects",
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useSessionTimeout(Boolean(user && token), () => {
    signOut("Your session has expired. Please log in again.");
  });

  const selectFeed = (feed: "projects" | "events") => {
    setActiveFeed(feed);
  };

  const resetAuthState = (nextMessage = "", shouldResetForm = true) => {
    setMode("login");
    if (shouldResetForm) {
      setForm(EMPTY_AUTH_FORM);
    }
    setIsProfileMenuOpen(false);
    setLocalMessage(nextMessage);
    setMessage(nextMessage);
    if (!nextMessage) {
      clearAuthState();
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (!normalizedSearch) return true;
    return [post.name, post.description, post.portfolio, post.author]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const filteredEvents = events.filter((event) => {
    if (!normalizedSearch) return true;
    return [event.name, event.location, event.theme, event.time, event.author]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const loadPosts = useCallback(async (page = 1, append = false) => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/posts/getPosts?page=${page}&limit=6`),
      );
      const data =
        await parseJsonResponse<PaginatedResponse<PostItem>>(response);

      if (response.ok && Array.isArray(data.items)) {
        setPosts((current) =>
          append ? [...current, ...data.items] : data.items,
        );
        setPostPage(data.currentPage);
        setHasMorePosts(data.hasNextPage);
      } else {
        setPosts([]);
        setPostPage(1);
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error("Failed to load posts", error);
      setPosts([]);
      setPostPage(1);
      setHasMorePosts(false);
    }
  }, []);

  const loadEvents = useCallback(async (page = 1, append = false) => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/events/getEvents?page=${page}&limit=12`),
      );
      const data =
        await parseJsonResponse<PaginatedResponse<EventItem>>(response);

      if (response.ok && Array.isArray(data.items)) {
        setEvents((current) =>
          append ? [...current, ...data.items] : data.items,
        );
        setEventPage(data.currentPage);
        setHasMoreEvents(data.hasNextPage);
      } else {
        setEvents([]);
        setEventPage(1);
        setHasMoreEvents(false);
      }
    } catch (error) {
      console.error("Failed to load events", error);
      setEvents([]);
      setEventPage(1);
      setHasMoreEvents(false);
    }
  }, []);

  const refreshCommunityData = useCallback(async () => {
    await Promise.all([loadPosts(1), loadEvents(1)]);
  }, [loadEvents, loadPosts]);

  useEffect(() => {
    const runRefresh = async () => {
      await refreshCommunityData();
    };

    void runRefresh();
  }, [refreshCommunityData, user?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

      const data = await parseJsonResponse<{
        message?: string;
        user?: unknown;
        token?: string;
        sessionId?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Request failed"));
      }

      if (mode === "signup") {
        resetAuthState(
          data.message ||
            "Account created. Please verify your email before logging in.",
        );
        return;
      }

      if (data.user) {
        setLocalMessage(data.message || "");
        setMessage(data.message || "");
        localStorage.setItem("snpl_user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("snpl_token", data.token);
        }
        if (data.sessionId) {
          localStorage.setItem("snpl_session_id", data.sessionId);
        }
        window.dispatchEvent(new Event("auth:state-changed"));
      }
    } catch (error) {
      setLocalMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/posts/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: postForm.name,
          description: postForm.description,
          portfolio: postForm.portfolio,
          author: user.username,
        }),
      });

      const data = await parseJsonResponse<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to create post"));
      }

      setPostForm(EMPTY_POST_FORM);
      await loadPosts();
      setLocalMessage(data.message || "Post created successfully");
      setMessage(data.message || "Post created successfully");
    } catch (error) {
      console.error("handlePostSubmit error:", error);
      setMessage(
        error instanceof Error ? error.message : "Unable to create post",
      );
    }
  };

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl("/api/v1/events/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventForm.name,
          location: eventForm.location,
          theme: eventForm.theme,
          time: eventForm.time,
          author: user.username,
        }),
      });

      const data = await parseJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to create event"));
      }

      setEventForm(EMPTY_EVENT_FORM);
      await loadEvents();
      setLocalMessage(data.message || "Event created successfully");
      setMessage(data.message || "Event created successfully");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create event",
      );
    }
  };

  const handleLogout = async () => {
    if (!user) {
      resetAuthState();
      return;
    }

    try {
      await authService.logout();
      resetAuthState("You have been logged out.");
    } catch (error) {
      resetAuthState(error instanceof Error ? error.message : "Logout failed");
    }
  };

  const handleLogoutEverywhere = async () => {
    if (!user) {
      resetAuthState();
      return;
    }

    const confirmed = window.confirm(
      "This will sign you out from all devices and sessions. Continue?",
    );
    if (!confirmed) {
      return;
    }

    try {
      await authService.logout({ logoutAll: true });
      resetAuthState("You have been logged out from all sessions.");
    } catch (error) {
      resetAuthState(
        error instanceof Error ? error.message : "Logout everywhere failed",
      );
    }
  };

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
      // This removes the deleted post right away from the screen.
      setPosts((current) => current.filter((post) => post._id !== postId));
      setMessage(data.message || "Post deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete this event? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/v1/events/delete/${eventId}`),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        },
      );
      const data = await parseJsonResponse<{ message?: string }>(response);
      if (!response.ok)
        throw new Error(getApiErrorMessage(data, "Delete failed"));
      setEvents((current) => current.filter((event) => event._id !== eventId));
      setMessage(data.message || "Event deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) {
      resetAuthState();
      return;
    }

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

      const data = await parseJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        console.warn(
          "Profile deletion request failed, forcing local sign-out",
          data,
        );
      }

      resetAuthState(data.message || "Profile deleted.");
    } catch (error) {
      resetAuthState(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (window.scrollY === 0) {
      const touchY = event.touches[0]?.clientY ?? 0;
      setPullDistance(touchY);
    }
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (window.scrollY !== 0) return;
    const touchY = event.touches[0]?.clientY ?? 0;
    const delta = touchY - pullDistance;
    setPullDistance(Math.max(0, Math.min(delta, 120)));
  };

  const handleTouchEnd = () => {
    if (pullDistance > 90) {
      setIsRefreshing(true);
      void refreshCommunityData();
      window.setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 700);
      return;
    }
    setPullDistance(0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2D1E2F]">
      <Header
        user={user}
        searchScope={searchScope}
        searchTerm={searchTerm}
        isSearchOpen={isSearchOpen}
        onSearchScopeChange={(scope) => {
          setSearchScope(scope);
          setActiveFeed(scope);
          setIsSearchOpen(true);
          selectFeed(scope);
        }}
        onSearchTermChange={setSearchTerm}
        onToggleSearch={() => setIsSearchOpen((value) => !value)}
        onOpenProfile={() => setIsProfileMenuOpen(true)}
      />

      <main
        className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!user ? (
          <AuthView
            mode={mode}
            form={form}
            message={message || localMessage || getSessionMessage()}
            loading={loading}
            isPaused={isPaused}
            onModeChange={setMode}
            onFormChange={setForm}
            onSubmit={handleSubmit}
            onPauseChange={setIsPaused}
          />
        ) : (
          <>
            <ProfileDrawer
              user={user}
              isOpen={isProfileMenuOpen}
              activeFeed={activeFeed}
              postForm={postForm}
              eventForm={eventForm}
              message={message || localMessage || getSessionMessage()}
              onClose={() => setIsProfileMenuOpen(false)}
              onPostFormChange={setPostForm}
              onEventFormChange={setEventForm}
              onPostSubmit={handlePostSubmit}
              onEventSubmit={handleEventSubmit}
              onLogout={handleLogout}
              onLogoutEverywhere={handleLogoutEverywhere}
              onDeleteProfile={handleDeleteProfile}
            />
            {activeFeed === "projects" ? (
              <>
                <Feed
                  posts={filteredPosts}
                  user={user}
                  viewMode={feedLayout}
                  onViewModeChange={setFeedLayout}
                  onDeletePost={handleDeletePost}
                />
                {hasMorePosts ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingMore(true);
                        await loadPosts(postPage + 1, true);
                        setLoadingMore(false);
                      }}
                      className="rounded-full border border-[#2D1E2F]/10 bg-white px-5 py-2 text-sm font-semibold text-[#2D1E2F] shadow-sm transition hover:bg-[#FFF8F0]"
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <EventFeed
                  events={filteredEvents}
                  user={user}
                  viewMode={feedLayout}
                  onViewModeChange={setFeedLayout}
                  onDeleteEvent={handleDeleteEvent}
                />
                {hasMoreEvents ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingMore(true);
                        await loadEvents(eventPage + 1, true);
                        setLoadingMore(false);
                      }}
                      className="rounded-full border border-[#2D1E2F]/10 bg-white px-5 py-2 text-sm font-semibold text-[#2D1E2F] shadow-sm transition hover:bg-[#FFF8F0]"
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      {user ? (
        <>
          <button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] text-[#2D1E2F] shadow-[0_16px_50px_rgba(45,30,47,0.14)] transition hover:-translate-y-0.5"
            aria-label="Return to top"
          >
            <ArrowUp size={18} />
          </button>

          <nav className="sticky bottom-3 z-20 mx-auto mb-5 flex max-w-lg flex-wrap items-center justify-center gap-2 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-3 py-2 shadow-[0_16px_50px_rgba(45,30,47,0.14)] backdrop-blur">
            <button
              type="button"
              onClick={() => selectFeed("projects")}
              className={`rounded-full px-6 py-2 text-sm font-semibold ${
                activeFeed === "projects"
                  ? "bg-[#EF476F] text-[#FFF8F0]"
                  : "text-[#2D1E2F]"
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => selectFeed("events")}
              className={`rounded-full px-6 py-2 text-sm font-semibold ${
                activeFeed === "events"
                  ? "bg-[#FF6B35] text-[#FFF8F0]"
                  : "text-[#2D1E2F]"
              }`}
            >
              Events
            </button>
            {user?.role === "admin" ? (
              <button
                type="button"
                onClick={() => window.location.assign("/admin")}
                className="rounded-full bg-[#2D1E2F] px-6 py-2 text-sm font-semibold text-[#FFF8F0]"
              >
                Dash
              </button>
            ) : null}
          </nav>
        </>
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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === "admin";

  if (!storedUser) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Routing stays here so the smaller page parts do not need to know about routes.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense
                fallback={
                  <div className="p-8 text-center text-sm text-[#2D1E2F]">
                    Loading admin dashboard…
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
