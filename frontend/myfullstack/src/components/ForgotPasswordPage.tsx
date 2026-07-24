import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { buildApiUrl } from "../api.ts";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to request password reset.");
      }

      setMessage(data.message);
      setEmail("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
      <div className="w-full rounded-[2rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/95 p-6 shadow-[0_20px_60px_rgba(45,30,47,0.16)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-[#EF476F]/10 p-3 text-[#EF476F]">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
              Account access
            </p>
            <h1 className="font-['Bebas_Neue'] text-3xl text-[#2D1E2F]">
              Forgot password
            </h1>
          </div>
        </div>

        <p className="mb-4 text-sm leading-6 text-[#2D1E2F]/75">
          Enter the email on your account and we will send a reset link if it
          matches an existing profile.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-[#2D1E2F]/80">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
              placeholder="you@class.com"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EF476F] px-4 py-3 font-semibold text-[#FFF8F0] shadow-[0_12px_35px_rgba(239,71,111,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send reset link"}
            <Send size={16} />
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl border border-[#F9B208]/30 bg-[#F9B208]/10 px-4 py-3 text-sm text-[#2D1E2F]">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-[#EF476F]/20 bg-[#EF476F]/10 px-4 py-3 text-sm text-[#EF476F]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 text-center text-sm">
          <Link
            to="/"
            className="font-semibold text-[#EF476F] underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
