import { type FormEvent, type TouchEvent, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthView } from "./components/AuthView.tsx";
import { EventFeed } from "./components/EventFeed.tsx";
import { Feed } from "./components/Feed.tsx";
import { Header } from "./components/Header.tsx";
import { ProfileDrawer } from "./components/ProfileDrawer.tsx";
import { buildApiUrl } from "./api.ts";
import type {
  AuthForm,
  AuthMode,
  EventForm,
  EventItem,
  PostForm,
  PostItem,
  ProfileForm,
  UserProfile,
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

const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem("snpl_user");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch (error) {
    console.error("failed reading local user", error);
    return null;
  }
};

const clearAuthState = (
  setUser: (value: UserProfile | null) => void,
  setMode: (value: AuthMode) => void,
  setForm: (value: AuthForm) => void,
  setMessage: (value: string) => void,
  setProfileForm: (value: ProfileForm) => void,
  setIsProfileMenuOpen: (value: boolean) => void,
) => {
  setUser(null);
  try {
    localStorage.removeItem("snpl_user");
  } catch (error) {
    console.error("failed clearing stored user", error);
  }
  setMode("login");
  setForm(EMPTY_AUTH_FORM);
  setProfileForm(EMPTY_AUTH_FORM);
  setIsProfileMenuOpen(false);
  setMessage("");
};

function AppShell() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthForm>(EMPTY_AUTH_FORM);
  const [message, setMessage] = useState("");
  // This reads the saved user before the page starts, so refresh keeps the login.
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [postForm, setPostForm] = useState<PostForm>(EMPTY_POST_FORM);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT_FORM);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_AUTH_FORM);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFeed, setActiveFeed] = useState<"projects" | "events">(
    "projects",
  );

  const selectFeed = (feed: "projects" | "events") => {
    setActiveFeed(feed);
    window.location.hash = feed === "projects" ? "feed" : "events";
    window.setTimeout(() => {
      document
        .getElementById(feed === "projects" ? "feed" : "events")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 0);
  };

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

  const loadEvents = async () => {
    try {
      const response = await fetch(buildApiUrl("/api/v1/events/getEvents"));
      const data = await response.json();
      if (response.ok) {
        setEvents(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user) {
      // These requests wait until the logged-in page has started drawing.
      void Promise.resolve().then(loadPosts);
      void Promise.resolve().then(loadEvents);
    }
  }, [user]);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (mode === "signup") {
        clearAuthState(
          setUser,
          setMode,
          setForm,
          setMessage,
          setProfileForm,
          setIsProfileMenuOpen,
        );
        setMessage(
          data.message ||
            "Account created. Please verify your email before logging in.",
        );
        return;
      }

      setUser(data.user);
      // This saves the user so a refresh does not log out.
      try {
        localStorage.setItem("snpl_user", JSON.stringify(data.user));
      } catch (error) {
        console.error("failed persisting user", error);
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
          age: 0,
          portfolio: postForm.portfolio,
          author: user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      setPostForm(EMPTY_POST_FORM);
      await loadPosts();
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      setEventForm(EMPTY_EVENT_FORM);
      await loadEvents();
      setMessage(data.message || "Event created successfully");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create event",
      );
    }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
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
    if (!user) {
      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/v1/users/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn("Logout request failed, forcing local sign-out", data);
      }

      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
      setMessage(data.message || "You have been logged out.");
    } catch (error) {
      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
      setMessage(error instanceof Error ? error.message : "Logout failed");
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      setEvents((current) => current.filter((event) => event._id !== eventId));
      setMessage(data.message || "Event deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) {
      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn(
          "Profile deletion request failed, forcing local sign-out",
          data,
        );
      }

      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
      setMessage(data.message || "Profile deleted.");
    } catch (error) {
      clearAuthState(
        setUser,
        setMode,
        setForm,
        setMessage,
        setProfileForm,
        setIsProfileMenuOpen,
      );
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
      void loadPosts();
      window.setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 700);
      return;
    }
    setPullDistance(0);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2D1E2F]">
      <Header user={user} onOpenProfile={() => setIsProfileMenuOpen(true)} />

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
            message={message}
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
              isEditing={isEditingProfile}
              profileForm={profileForm}
              postForm={postForm}
              eventForm={eventForm}
              message={message}
              onClose={() => setIsProfileMenuOpen(false)}
              onToggleEditing={() => setIsEditingProfile((value) => !value)}
              onProfileFormChange={setProfileForm}
              onPostFormChange={setPostForm}
              onEventFormChange={setEventForm}
              onProfileSubmit={handleProfileUpdate}
              onPostSubmit={handlePostSubmit}
              onEventSubmit={handleEventSubmit}
              onLogout={handleLogout}
              onDeleteProfile={handleDeleteProfile}
            />
            {activeFeed === "projects" ? (
              <Feed posts={posts} user={user} onDeletePost={handleDeletePost} />
            ) : (
              <EventFeed
                events={events}
                user={user}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
          </>
        )}
      </main>

      {user ? (
        <nav className="sticky bottom-3 z-20 mx-auto mb-5 flex max-w-md items-center justify-center rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-3 py-2 shadow-[0_16px_50px_rgba(45,30,47,0.14)] backdrop-blur">
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
  // Routing stays here so the smaller page parts do not need to know about routes.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
