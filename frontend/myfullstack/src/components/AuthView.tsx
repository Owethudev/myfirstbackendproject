import {
  type FormEvent,
  type Dispatch,
  type SetStateAction,
  Suspense,
  lazy,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, Send } from "lucide-react";
import logo from "../assets/logo.png";
import { MARQUEE_ITEMS } from "../constants.ts";
import type { AuthForm, AuthMode } from "../types.ts";

const OrbitalScene = lazy(() =>
  import("./OrbitalScene.tsx").then((module) => ({ default: module.OrbitalScene })),
);

type AuthViewProps = {
  mode: AuthMode;
  form: AuthForm;
  message: string;
  loading: boolean;
  isPaused: boolean;
  onModeChange: (mode: AuthMode) => void;
  onFormChange: Dispatch<SetStateAction<AuthForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPauseChange: (paused: boolean) => void;
  onContinueAsGuest: () => void;
};

export function AuthView({
  mode,
  form,
  message,
  loading,
  isPaused,
  onModeChange,
  onFormChange,
  onSubmit,
  onPauseChange,
  onContinueAsGuest,
}: AuthViewProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-layout">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="auth-story"
      >
        <div className="auth-hero-copy">
          <div className="auth-hero-title">
            <p className="eyebrow">SNPL PORT — CREATIVE COMMUNITY</p>
            <h2>
              Make room
              <br />
              for <span>what’s next.</span>
            </h2>
            <p className="auth-intro">
              A place to put your work out there, find your people, and make something worth sharing.
            </p>
            <a className="auth-explore-link" href="#community">
              Explore the community <ArrowDownRight size={17} />
            </a>
          </div>
          <div className="auth-artwork">
            <span className="artwork-caption">FORM / 001</span>
            <Suspense fallback={<div className="orbital-fallback" />}>
              <OrbitalScene />
            </Suspense>
            <span className="artwork-coordinate">36° 09' 12.0" N<br />115° 08' 32.4" W</span>
          </div>
        </div>
        <div className="auth-community" id="community">
          <div className="community-label">
            <span className="eyebrow">Good things happen together</span>
            <span className="community-count">A PLACE TO BEGIN <ArrowUpRight size={14} /></span>
          </div>
          <div
            className="conveyor-track"
            onMouseEnter={() => onPauseChange(true)}
            onMouseLeave={() => onPauseChange(false)}
            onTouchStart={() => onPauseChange(true)}
            onTouchEnd={() => onPauseChange(false)}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((name, index) => (
              <span key={`${name}-${index}`} className="community-pill">
                <img className="brand-logo" src={logo} alt="" /> {name}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="auth-panel"
      >
        <div className="auth-panel-heading">
          <div>
            <p className="eyebrow">{mode === "login" ? "Sign in" : "Your next chapter"}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={mode}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.18 }}
              >
              {mode === "login" ? "Welcome back." : "Come on in."}
              </motion.h3>
            </AnimatePresence>
          </div>
          <div className="auth-panel-icon">
            <img className="brand-logo" src={logo} alt="" />
          </div>
        </div>

        <div className="auth-mode-switch">
          {(["login", "signup"] as AuthMode[]).map((option) => (
            <button
              key={option}
              type="button"
              className={mode === option ? "is-active" : ""}
              aria-pressed={mode === option}
              onClick={() => onModeChange(option)}
            >
              {option === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.form
            key={mode}
            onSubmit={onSubmit}
            className="auth-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {mode === "signup" && (
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) =>
                    onFormChange({ ...form, username: event.target.value })
                  }
                  placeholder="Name"
                  required
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  onFormChange({ ...form, email: event.target.value })
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    onFormChange({ ...form, password: event.target.value })
                  }
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="password-visibility"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? "Working..." : mode === "login" ? "Login" : "Sign up"}
              <span className="submit-icon"><Send size={15} /></span>
            </button>

            {mode === "login" ? (
              <div className="forgot-link">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            ) : null}
          </motion.form>
        </AnimatePresence>

        {message ? (
          <p className="auth-message" role="status">
            {message}
          </p>
        ) : null}

        <div className="guest-entry">
          <p>Just looking around?</p>
          <button
            type="button"
            onClick={onContinueAsGuest}
          >
            Browse as a guest <ArrowUpRight size={15} />
          </button>
        </div>
        <p className="auth-legal">By continuing, you agree to create with respect and give others room to grow.</p>
      </motion.section>
    </div>
  );
}
