import { Menu, Search } from "lucide-react";
import type { UserProfile } from "../types.ts";

type HeaderProps = {
  user: UserProfile | null;
  searchScope: "projects" | "events";
  searchTerm: string;
  isSearchOpen: boolean;
  onSearchScopeChange: (scope: "projects" | "events") => void;
  onSearchTermChange: (value: string) => void;
  onToggleSearch: () => void;
  onOpenProfile: () => void;
};

export function Header({
  user,
  searchScope,
  searchTerm,
  isSearchOpen,
  onSearchScopeChange,
  onSearchTermChange,
  onToggleSearch,
  onOpenProfile,
}: HeaderProps) {
  // This top bar shows the page name, optional search controls, and the profile menu button.
  return (
    <header className="sticky top-0 z-30 border-b border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className={isSearchOpen ? "hidden sm:block" : "block"}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#EF476F]">
            SNPL PORT
          </p>
          <h1 className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#2D1E2F] sm:text-3xl">
            {user
              ? `WELCOME, ${user.username.toUpperCase()}`
              : "CLASSROOM PORTFOLIO"}
          </h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {user ? (
            <>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-3 py-2 text-xs font-semibold text-[#2D1E2F] transition hover:bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#EF476F]/40"
                onClick={onToggleSearch}
                aria-label="Toggle search"
              >
                <Search size={16} />
                Search
              </button>
              {isSearchOpen ? (
                <div className="flex items-center gap-2 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 px-2 py-1.5 shadow-sm">
                  <div className="flex items-center gap-1 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] p-1">
                    <button
                      type="button"
                      onClick={() => onSearchScopeChange("projects")}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        searchScope === "projects"
                          ? "bg-[#EF476F] text-[#FFF8F0]"
                          : "text-[#2D1E2F]"
                      }`}
                    >
                      Projects
                    </button>
                    <button
                      type="button"
                      onClick={() => onSearchScopeChange("events")}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        searchScope === "events"
                          ? "bg-[#FF6B35] text-[#FFF8F0]"
                          : "text-[#2D1E2F]"
                      }`}
                    >
                      Events
                    </button>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder="Search…"
                    className="w-28 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-3 py-1 text-xs text-[#2D1E2F] outline-none placeholder:text-[#2D1E2F]/45"
                    aria-label="Search query"
                  />
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0]/90 p-2 text-[#2D1E2F] transition hover:bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#EF476F]/40"
                onClick={onOpenProfile}
                aria-label="Open profile menu"
              >
                <Menu size={20} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
