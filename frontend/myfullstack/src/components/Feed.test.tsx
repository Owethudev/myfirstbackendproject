import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventFeed } from "./EventFeed";
import { Feed } from "./Feed";

describe("Feed request states", () => {
  it("shows loading, empty, and retryable failure as distinct states", () => {
    const onRetry = vi.fn();
    const props = {
      posts: [],
      user: null,
      viewMode: "current" as const,
      onRetry,
      onViewModeChange: () => {},
      onDeletePost: () => {},
    };

    const { rerender } = render(
      <Feed {...props} requestState={{ status: "loading" }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading posts");

    rerender(<Feed {...props} requestState={{ status: "ready" }} />);
    expect(screen.getByText(/No posts yet/i)).toBeInTheDocument();

    rerender(
      <Feed
        {...props}
        requestState={{ status: "error", message: "Posts could not load" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Posts could not load");
    expect(screen.queryByText(/No posts yet/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading posts" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows event failures separately from a successful empty result", () => {
    const onRetry = vi.fn();
    const props = {
      events: [],
      user: null,
      viewMode: "current" as const,
      onRetry,
      onViewModeChange: () => {},
      onDeleteEvent: () => {},
    };

    const { rerender } = render(
      <EventFeed {...props} requestState={{ status: "ready" }} />,
    );
    expect(screen.getByText(/No events yet/i)).toBeInTheDocument();

    rerender(
      <EventFeed
        {...props}
        requestState={{ status: "error", message: "Events could not load" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Events could not load");
    expect(screen.queryByText(/No events yet/i)).not.toBeInTheDocument();
  });
});
