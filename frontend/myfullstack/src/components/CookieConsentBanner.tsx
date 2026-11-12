import { useState } from "react";

const STORAGE_NOTICE_KEY = "snpl_storage_notice_dismissed";
const COOKIE_POLICY_URL =
  "https://github.com/Owethudev/myfirstbackendproject/blob/main/docs/policies/cookie-policy.md";

const wasNoticeDismissed = () => {
  try {
    return window.localStorage.getItem(STORAGE_NOTICE_KEY) === "true";
  } catch (error) {
    console.error("failed reading storage notice state", error);
    return false;
  }
};

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => !wasNoticeDismissed());

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_NOTICE_KEY, "true");
    } catch (error) {
      console.error("failed saving storage notice state", error);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      className="storage-notice"
      role="region"
      aria-label="Cookie and storage notice"
    >
      <div className="storage-notice-copy">
        <p className="storage-notice-kicker">Cookies and browser storage</p>
        <p>
          SNPL PORT does not currently use analytics or advertising cookies.
          Signing in stores session data in your browser's local storage so you
          can stay signed in. Guest browsing is available without an account.
        </p>
      </div>
      <div className="storage-notice-actions">
        <a href={COOKIE_POLICY_URL} target="_blank" rel="noreferrer">
          Cookie and storage policy
        </a>
        <button type="button" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}
