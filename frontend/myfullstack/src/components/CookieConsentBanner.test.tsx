import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CookieConsentBanner } from "./CookieConsentBanner";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains essential local storage without presenting fake optional-cookie choices", () => {
    render(<CookieConsentBanner />);

    expect(
      screen.getByRole("region", { name: "Cookie and storage notice" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not currently use analytics or advertising cookies/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cookie and storage policy" }),
    ).toHaveAttribute("href", expect.stringContaining("cookie-policy.md"));
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
  });

  it("remembers a dismissal without creating tracking consent", () => {
    render(<CookieConsentBanner />);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(
      screen.queryByRole("region", { name: "Cookie and storage notice" }),
    ).toBeNull();
    expect(window.localStorage.getItem("snpl_storage_notice_dismissed")).toBe(
      "true",
    );
    expect(window.localStorage.length).toBe(1);
  });
});
