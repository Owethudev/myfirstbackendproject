import { render, screen } from "@testing-library/react";
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
