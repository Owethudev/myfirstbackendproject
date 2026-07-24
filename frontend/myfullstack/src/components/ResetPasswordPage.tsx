import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { buildApiUrl } from "../api.ts";

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordRequirements = [
    "At least 6 characters",
    "Use a password you have not used before",
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password.");
      }

      setMessage(data.message || "Password reset successfully.");
      window.setTimeout(() => {
        navigate("/");
      }, 1200);
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
          <div className="rounded-full bg-[#FF6B35]/10 p-3 text-[#FF6B35]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
              Secure account
            </p>
            <h1 className="font-['Bebas_Neue'] text-3xl text-[#2D1E2F]">
              Reset password
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-[#2D1E2F]/80">
            <span className="mb-2 block">New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
              placeholder="New password"
              required
            />
          </label>

          <label className="block text-sm font-medium text-[#2D1E2F]/80">
            <span className="mb-2 block">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
              placeholder="Confirm password"
              required
            />
          </label>

          <div className="rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 text-sm text-[#2D1E2F]/75">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#2D1E2F]">
              <Lock size={15} />
              Password requirements
            </div>
            <ul className="list-disc space-y-1 pl-5">
              {passwordRequirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EF476F] px-4 py-3 font-semibold text-[#FFF8F0] shadow-[0_12px_35px_rgba(239,71,111,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Resetting..." : "Reset password"}
            <ShieldCheck size={16} />
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
