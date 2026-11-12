import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProfileDrawer } from "./ProfileDrawer";

const createProps = (role: "user" | "admin") => ({
  user: {
    id: `${role}-1`,
    username: role,
    email: `${role}@example.test`,
    role,
  },
  isOpen: true,
  activeFeed: "projects" as const,
  triggerRef: { current: null },
  postForm: { name: "", description: "", portfolio: "" },
  eventForm: { name: "", location: "", theme: "", time: "" },
  message: "",
  onClose: vi.fn(),
  onPostFormChange: vi.fn(),
  onEventFormChange: vi.fn(),
  onPostSubmit: vi.fn(),
  onEventSubmit: vi.fn(),
  onLogout: vi.fn(),
  onLogoutEverywhere: vi.fn(),
});

describe("ProfileDrawer account deletion access", () => {
  it("does not offer admin-only deletion to an ordinary user", () => {
    render(<ProfileDrawer {...createProps("user")} />);

    expect(screen.queryByRole("button", { name: "Delete profile" })).toBeNull();
  });

  it("does not offer self-deletion to an admin", () => {
    render(<ProfileDrawer {...createProps("admin")} />);

    expect(screen.queryByRole("button", { name: "Delete profile" })).toBeNull();
  });
});

describe("ProfileDrawer content", () => {
  it("shows an accessible project composer in the app's dark profile drawer", () => {
    render(<ProfileDrawer {...createProps("user")} />);

    expect(screen.getByRole("dialog", { name: "user" })).toHaveClass(
      "profile-drawer",
    );
    expect(
      screen.getByRole("heading", { name: "Share your project" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Project title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Portfolio link")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish project/i }),
    ).toBeInTheDocument();
  });

  it("shows the event composer when the events feed is active", () => {
    render(<ProfileDrawer {...createProps("user")} activeFeed="events" />);

    expect(
      screen.getByRole("heading", { name: "Create an event" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Event name")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Event time")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Share your project" }),
    ).toBeNull();
  });

  it("hides and disables the drawer when it is closed", () => {
    render(<ProfileDrawer {...createProps("user")} isOpen={false} />);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Close profile drawer" }),
    ).toBeNull();
  });

  it("traps keyboard focus, closes with Escape, and restores focus to its trigger", async () => {
    const DrawerHarness = () => {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [isOpen, setIsOpen] = useState(true);
      const props = createProps("user");

      return (
        <>
          <button type="button" ref={triggerRef}>
            Open profile
          </button>
          <ProfileDrawer
            {...props}
            isOpen={isOpen}
            triggerRef={triggerRef}
            onClose={() => setIsOpen(false)}
          />
        </>
      );
    };

    render(<DrawerHarness />);
    const closeButton = screen.getByRole("button", {
      name: "Close profile drawer",
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    screen.getByRole("button", { name: "Log out everywhere" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("button", { name: "Open profile" })).toHaveFocus();
    });
  });
});
