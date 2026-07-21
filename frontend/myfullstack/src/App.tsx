import { type FormEvent, useEffect, useState } from "react";
import "./App.css";

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
  createdAt?: string;
};

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postForm, setPostForm] = useState({
    name: "",
    description: "",
    age: "",
    portfolio: "",
  });

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/v1/posts/getPosts");
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
      loadPosts();
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const endpoint =
      mode === "login" ? "/api/v1/users/login" : "/api/v1/users/register";
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
      const response = await fetch("/api/v1/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: postForm.name,
          description: postForm.description,
          age: Number(postForm.age),
          portfolio: postForm.portfolio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      setPostForm({ name: "", description: "", age: "", portfolio: "" });
      await loadPosts();
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create post",
      );
    }
  };

  const handleLogout = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/v1/users/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Logout failed");
      }

      setUser(null);
      setMessage(data.message);
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logout failed");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile?",
    );
    if (!confirmed) return;

    try {
      const response = await fetch("/api/v1/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setUser(null);
      setMessage(data.message);
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Portfolio Social</p>
          <h1>{user ? `Welcome, ${user.username}` : "Alex Morgan"}</h1>
        </div>
        <nav>
          <a href="#feed">Feed</a>
          <a href="#create">Create</a>
        </nav>
      </header>

      <main className="content-grid">
        {!user ? (
          <section className="hero-card">
            <div>
              <p className="eyebrow">Full-stack developer</p>
              <h2>Building practical web experiences from API to UI.</h2>
              <p>
                This app connects the React frontend to the Node/Express backend
                through authenticated API routes.
              </p>
            </div>

            <div className="auth-card">
              <div className="mode-switch">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={mode === "signup" ? "active" : ""}
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <label>
                    Username
                    <input
                      type="text"
                      value={form.username}
                      onChange={(event) =>
                        setForm({ ...form, username: event.target.value })
                      }
                      required
                    />
                  </label>
                )}

                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    required
                  />
                </label>

                <button type="submit" disabled={loading}>
                  {loading
                    ? "Working..."
                    : mode === "login"
                      ? "Login"
                      : "Create account"}
                </button>
              </form>

              {message && <p className="status-message">{message}</p>}
            </div>
          </section>
        ) : (
          <>
            <section className="composer-card" id="create">
              <div className="section-header">
                <h2>Profile</h2>
                <div className="action-row">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleDeleteProfile}
                  >
                    Delete profile
                  </button>
                </div>
              </div>
              <div className="profile-card">
                <p>
                  <strong>Username:</strong> {user?.username}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>

              <h2>Create a post</h2>
              <form onSubmit={handlePostSubmit} className="composer-form">
                <input
                  placeholder="Name"
                  value={postForm.name}
                  onChange={(event) =>
                    setPostForm({ ...postForm, name: event.target.value })
                  }
                  required
                />
                <textarea
                  placeholder="Description"
                  value={postForm.description}
                  onChange={(event) =>
                    setPostForm({
                      ...postForm,
                      description: event.target.value,
                    })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={postForm.age}
                  onChange={(event) =>
                    setPostForm({ ...postForm, age: event.target.value })
                  }
                  required
                />
                <input
                  placeholder="Portfolio link"
                  value={postForm.portfolio}
                  onChange={(event) =>
                    setPostForm({ ...postForm, portfolio: event.target.value })
                  }
                  required
                />
                <button type="submit">Share post</button>
              </form>
              {message && <p className="status-message">{message}</p>}
            </section>

            <section className="feed-card" id="feed">
              <h2>Community feed</h2>
              {posts.length === 0 ? (
                <p>No posts yet. Be the first to share one.</p>
              ) : (
                posts.map((post) => (
                  <article key={post._id} className="post-item">
                    <div className="post-meta">
                      <strong>{post.name}</strong>
                      <span>{post.age} years old</span>
                    </div>
                    <p>{post.description}</p>
                    <a href={post.portfolio} target="_blank" rel="noreferrer">
                      {post.portfolio}
                    </a>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
