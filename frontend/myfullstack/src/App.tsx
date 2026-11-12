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
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { AuthView } from "./components/AuthView.tsx";
import { CookieConsentBanner } from "./components/CookieConsentBanner.tsx";
import { EventFeed } from "./components/EventFeed.tsx";
import { Feed } from "./components/Feed.tsx";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage.tsx";
import { Header } from "./components/Header.tsx";
import { ProfileDrawer } from "./components/ProfileDrawer.tsx";
import { ResetPasswordPage } from "./components/ResetPasswordPage.tsx";
import { buildApiUrl, getApiErrorMessage, parseJsonResponse } from "./api.ts";
import { authService } from "./services/authService.ts";
import { apiClient } from "./services/apiClient.ts";
import {
  clearAuthState,
  getSessionMessage,
  getStoredUser,
} from "./services/sessionManager.ts";
import { usePaginatedFeed } from "./hooks/usePaginatedFeed.ts";
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

function AppShell() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthForm>(EMPTY_AUTH_FORM);
  const { user, token, message, signOut, setMessage } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const postFeed = usePaginatedFeed<PostItem>("/api/v1/posts/getPosts", 6);
  const eventFeed = usePaginatedFeed<EventItem>("/api/v1/events/getEvents", 12);
  const loadPostPage = postFeed.loadPage;
  const loadEventPage = eventFeed.loadPage;
  const { items: posts } = postFeed;
  const { items: events } = eventFeed;
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
    setIsGuest(false);
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

  const refreshCommunityData = useCallback(async () => {
    await Promise.all([loadPostPage(1), loadEventPage(1)]);
  }, [loadEventPage, loadPostPage]);

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
        setIsGuest(false);
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
      const data = await apiClient.post("/api/v1/posts/create", {
          name: postForm.name,
          description: postForm.description,
          portfolio: postForm.portfolio,
          author: user.username,
      });

      setPostForm(EMPTY_POST_FORM);
      await postFeed.loadPage();
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
      const data = await apiClient.post("/api/v1/events/create", {
          name: eventForm.name,
          location: eventForm.location,
          theme: eventForm.theme,
          time: eventForm.time,
          author: user.username,
      });

      setEventForm(EMPTY_EVENT_FORM);
      await eventFeed.loadPage();
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
      const data = await apiClient.del(
        `/api/v1/posts/delete/${postId}`,
        {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        },
      );
      // This removes the deleted post right away from the screen.
      postFeed.removeItem(postId);
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
      const data = await apiClient.del(
        `/api/v1/events/delete/${eventId}`,
        {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        },
      );
      eventFeed.removeItem(eventId);
      setMessage(data.message || "Event deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
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
    <div className="app-shell">
      <Header
        user={user}
        isGuest={isGuest}
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
        onLeaveGuest={() => {
          setIsGuest(false);
          setIsSearchOpen(false);
          setLocalMessage("");
        }}
      />
      <CookieConsentBanner />

      <main
        className="app-main"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!user && !isGuest ? (
            <motion.div
              key="auth"
              className="state-transition"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
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
                onContinueAsGuest={() => {
                  setIsGuest(true);
                  setLocalMessage("");
                  setMessage("");
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="community"
              className="state-transition"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
            {user ? (
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
              />
            ) : null}
            <AnimatePresence mode="wait" initial={false}>
              {activeFeed === "projects" ? (
                <motion.div
                  key="projects"
                  className="feed-state-transition"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                <Feed
                  posts={filteredPosts}
                  user={user}
                  viewMode={feedLayout}
                  requestState={postFeed.requestState}
                  onRetry={() => void postFeed.loadPage()}
                  onViewModeChange={setFeedLayout}
                  onDeletePost={handleDeletePost}
                />
                {postFeed.hasNextPage ? (
                  <div className="load-more-wrap">
                    <button
                      type="button"
                      disabled={
                        postFeed.loadingMore ||
                        postFeed.requestState.status !== "ready"
                      }
                      onClick={() =>
                        void postFeed.loadPage(postFeed.currentPage + 1, true)
                      }
                      className="load-more-button"
                    >
                      {postFeed.loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="events"
                  className="feed-state-transition"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                <EventFeed
                  events={filteredEvents}
                  user={user}
                  viewMode={feedLayout}
                  requestState={eventFeed.requestState}
                  onRetry={() => void eventFeed.loadPage()}
                  onViewModeChange={setFeedLayout}
                  onDeleteEvent={handleDeleteEvent}
                />
                {eventFeed.hasNextPage ? (
                  <div className="load-more-wrap">
                    <button
                      type="button"
                      disabled={
                        eventFeed.loadingMore ||
                        eventFeed.requestState.status !== "ready"
                      }
                      onClick={() =>
                        void eventFeed.loadPage(eventFeed.currentPage + 1, true)
                      }
                      className="load-more-button"
                    >
                      {eventFeed.loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                ) : null}
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {user || isGuest ? (
        <>
          <button
            type="button"
            onClick={scrollToTop}
            className="return-top"
            aria-label="Return to top"
          >
            <ArrowUp size={18} />
          </button>

          <nav className="community-nav">
            <button
              type="button"
              onClick={() => selectFeed("projects")}
              className={activeFeed === "projects" ? "is-active" : ""}
              aria-pressed={activeFeed === "projects"}
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => selectFeed("events")}
              className={activeFeed === "events" ? "is-active" : ""}
              aria-pressed={activeFeed === "events"}
            >
              Events
            </button>
            {user?.role === "admin" ? (
              <button
                type="button"
                onClick={() => window.location.assign("/admin")}
                className="admin-nav-link"
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

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="route-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
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
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  // Routing stays here so the smaller page parts do not need to know about routes.
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
