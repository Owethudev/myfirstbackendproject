import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthView } from "./components/AuthView";
import { EventFeed } from "./components/EventFeed";
import { Feed } from "./components/Feed";

vi.mock("./components/OrbitalScene.tsx", () => ({
  OrbitalScene: () => <div data-testid="orbital-scene" />,
}));

describe("AuthView", () => {
  it("renders the authentication screen", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthView
          mode="login"
          form={{ username: "", email: "", password: "" }}
          message=""
          loading={false}
          isPaused={false}
          onModeChange={() => {}}
          onFormChange={() => {}}
          onSubmit={() => {}}
          onPauseChange={() => {}}
          onContinueAsGuest={() => {}}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("orbital-scene")).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /browse as a guest/i })).toBeInTheDocument();
    expect(
      screen.getByText(/currently offers no paid checkout or subscriptions/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/by continuing, you agree/i)).toBeNull();
    expect(container.querySelector(".auth-panel-icon img")).toBeInTheDocument();
    expect(screen.queryByText(/a home for the next generation/i)).toBeNull();
    expect(screen.queryByText(/01 \/ create/i)).toBeNull();
    expect(
      Array.from(container.querySelectorAll("img")).every((image) =>
        image.hasAttribute("alt"),
      ),
    ).toBe(true);
    expect(
      Array.from(container.querySelectorAll("img.brand-logo")).every(
        (image) => image.getAttribute("alt") === "",
      ),
    ).toBe(true);
  });

  it("switches to signup fields when signup mode is selected", async () => {
    const AuthModeHarness = () => {
      const [mode, setMode] = useState<"login" | "signup">("login");

      return (
        <AuthView
          mode={mode}
          form={{ username: "", email: "", password: "" }}
          message=""
          loading={false}
          isPaused={false}
          onModeChange={setMode}
          onFormChange={() => {}}
          onSubmit={() => {}}
          onPauseChange={() => {}}
          onContinueAsGuest={() => {}}
        />
      );
    };

    render(
      <MemoryRouter>
        <AuthModeHarness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
    const ageConsent = screen.getByLabelText(
      /confirm that I am at least 16 years old/i,
    );
    const termsConsent = screen.getByLabelText(/agree to the Terms of Service/i);
    const privacyConsent = screen.getByLabelText(/read the Privacy Policy/i);
    expect(ageConsent).toBeRequired();
    expect(ageConsent).not.toBeChecked();
    expect(termsConsent).toBeRequired();
    expect(termsConsent).not.toBeChecked();
    expect(privacyConsent).toBeRequired();
    expect(privacyConsent).not.toBeChecked();
    expect(await screen.findByText(/come on in/i)).toBeInTheDocument();
    expect(await screen.findByTestId("orbital-scene")).toBeInTheDocument();
  });

  it("lets visitors continue without creating an account", () => {
    const onContinueAsGuest = vi.fn();

    render(
      <MemoryRouter>
        <AuthView
          mode="login"
          form={{ username: "", email: "", password: "" }}
          message=""
          loading={false}
          isPaused={false}
          onModeChange={() => {}}
          onFormChange={() => {}}
          onSubmit={() => {}}
          onPauseChange={() => {}}
          onContinueAsGuest={onContinueAsGuest}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /browse as a guest/i }));

    expect(onContinueAsGuest).toHaveBeenCalledOnce();
  });
});

describe("guest feed access", () => {
  it("shows project posts without signed-in post actions", () => {
    render(
      <Feed
        posts={[
          {
            _id: "project-1",
            name: "Guest-visible project",
            description: "A public project",
            portfolio: "https://example.com",
            author: "creator",
          },
        ]}
        user={null}
        viewMode="current"
        requestState={{ status: "ready" }}
        onRetry={() => {}}
        onViewModeChange={() => {}}
        onDeletePost={() => {}}
      />,
    );

    expect(screen.getAllByText("Guest-visible project").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /delete post/i })).toBeNull();
  });

  it("shows community events without signed-in event actions", () => {
    render(
      <EventFeed
        events={[
          {
            _id: "event-1",
            name: "Guest-visible event",
            location: "Online",
            theme: "Community",
            time: "Soon",
            author: "host",
          },
        ]}
        user={null}
        viewMode="current"
        requestState={{ status: "ready" }}
        onRetry={() => {}}
        onViewModeChange={() => {}}
        onDeleteEvent={() => {}}
      />,
    );

    expect(screen.getAllByText("Guest-visible event").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /delete event/i })).toBeNull();
  });

  it("shows only the creator and title for projects in grid view", () => {
    render(
      <Feed
        posts={[
          {
            _id: "project-1",
            name: "Grid project",
            description: "Project details are hidden in the grid",
            portfolio: "https://example.com",
            author: "creator",
          },
        ]}
        user={null}
        viewMode="grid"
        requestState={{ status: "ready" }}
        onRetry={() => {}}
        onViewModeChange={() => {}}
        onDeletePost={() => {}}
      />,
    );

    expect(screen.getByText("CREATOR")).toBeInTheDocument();
    expect(screen.getByText("Grid project")).toBeInTheDocument();
    expect(
      screen.queryByText("Project details are hidden in the grid"),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /view project/i })).toBeNull();
  });
});
