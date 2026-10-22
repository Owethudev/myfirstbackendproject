import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthView } from "./components/AuthView";
import { EventFeed } from "./components/EventFeed";
import { Feed } from "./components/Feed";

describe("AuthView", () => {
  it("renders the authentication screen", () => {
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
          onContinueAsGuest={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue as guest/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /continue as guest/i }));

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
