import { Menu, Search } from "lucide-react";
import logo from "../assets/logo.png";
import type { UserProfile } from "../types.ts";

type HeaderProps = {
  user: UserProfile | null;
  isGuest: boolean;
  searchScope: "projects" | "events";
  searchTerm: string;
  isSearchOpen: boolean;
  onSearchScopeChange: (scope: "projects" | "events") => void;
  onSearchTermChange: (value: string) => void;
  onToggleSearch: () => void;
  onOpenProfile: () => void;
  onLeaveGuest: () => void;
};

export function Header({
  user,
  isGuest,
  searchScope,
  searchTerm,
  isSearchOpen,
  onSearchScopeChange,
  onSearchTermChange,
  onToggleSearch,
  onOpenProfile,
  onLeaveGuest,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-brand" href="/" aria-label="SNPL PORT home">
          <span className="brand-mark">
            <img className="brand-logo" src={logo} alt="" />
          </span>
          <span className="brand-wordmark">SNPL<span>PORT</span></span>
        </a>
        <div className={isSearchOpen ? "hidden sm:block" : "block"}>
          <p className="header-context">
            {user
              ? `GOOD TO SEE YOU, ${user.username.toUpperCase()}`
              : isGuest
                ? "YOU'RE BROWSING AS A GUEST"
                : "A CREATIVE COMMUNITY"}
          </p>
        </div>
        <div className="header-actions">
          {user || isGuest ? (
            <>
              <button
                type="button"
                className="header-search-toggle"
                onClick={onToggleSearch}
                aria-label="Toggle search"
              >
                <Search size={16} />
                <span>Search</span>
              </button>
              {isSearchOpen ? (
                <div className="header-search">
                  <div className="search-scopes">
                    <button
                      type="button"
                      onClick={() => onSearchScopeChange("projects")}
                      className={searchScope === "projects" ? "is-active" : ""}
                      aria-pressed={searchScope === "projects"}
                    >
                      Projects
                    </button>
                    <button
                      type="button"
                      onClick={() => onSearchScopeChange("events")}
                      className={searchScope === "events" ? "is-active" : ""}
                      aria-pressed={searchScope === "events"}
                    >
                      Events
                    </button>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder="Search…"
                    className="header-search-input"
                    aria-label="Search query"
                  />
                </div>
              ) : null}
              {user ? (
                <button
                  type="button"
                  className="header-icon-button"
                  onClick={onOpenProfile}
                  aria-label="Open profile menu"
                >
                  <Menu size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLeaveGuest}
                  className="header-sign-in"
                >
                  Sign in
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
