import { type FormEvent, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { Compass, Send, Sparkles } from "lucide-react";
import { MARQUEE_ITEMS } from "../constants.ts";
import type { AuthForm, AuthMode } from "../types.ts";

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
}: AuthViewProps) {
  // I keep the public landing content and authentication form together because they share the unauthenticated view.
  return (
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
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#3D5A40]">
            <Compass size={14} />
            SNPL community
          </div>
          <div
            className="conveyor-track flex w-max gap-3"
            onMouseEnter={() => onPauseChange(true)}
            onMouseLeave={() => onPauseChange(false)}
            onTouchStart={() => onPauseChange(true)}
            onTouchEnd={() => onPauseChange(false)}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {MARQUEE_ITEMS.map((name, index) => (
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
              onClick={() => onModeChange(option)}
            >
              {option === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <label className="block text-sm font-medium text-[#2D1E2F]/80">
              <span className="mb-2 block">Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  onFormChange({ ...form, username: event.target.value })
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
                onFormChange({ ...form, email: event.target.value })
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
                onFormChange({ ...form, password: event.target.value })
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
            {loading ? "Working..." : mode === "login" ? "Login" : "Sign up"}
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
  );
}
