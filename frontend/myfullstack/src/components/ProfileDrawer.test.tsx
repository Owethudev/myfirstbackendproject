import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileDrawer } from "./ProfileDrawer";

const createProps = (role: "user" | "admin", onDeleteProfile = vi.fn()) => ({
  user: {
    id: `${role}-1`,
    username: role,
    email: `${role}@example.test`,
    role,
  },
  isOpen: true,
  activeFeed: "projects" as const,
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
  onDeleteProfile,
});

describe("ProfileDrawer account deletion access", () => {
  it("does not offer admin-only deletion to an ordinary user", () => {
    render(<ProfileDrawer {...createProps("user")} />);

    expect(screen.queryByRole("button", { name: "Delete profile" })).toBeNull();
  });

  it("offers deletion to an admin and invokes its callback", () => {
    const onDeleteProfile = vi.fn();
    render(<ProfileDrawer {...createProps("admin", onDeleteProfile)} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    expect(onDeleteProfile).toHaveBeenCalledOnce();
  });
});
