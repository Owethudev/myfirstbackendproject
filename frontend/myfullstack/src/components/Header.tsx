import { Menu } from "lucide-react";
import type { UserProfile } from "../types.ts";

type HeaderProps = {
  user: UserProfile | null;
  onOpenProfile: () => void;
};

export function Header({ user, onOpenProfile }: HeaderProps) {
  // I keep the shared page heading and profile entry point together at the top of the shell.
  return (
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
              onClick={onOpenProfile}
              aria-label="Open profile menu"
            >
              <Menu size={20} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
