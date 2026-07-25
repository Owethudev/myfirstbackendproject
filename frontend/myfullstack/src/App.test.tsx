import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthView } from "./components/AuthView";

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
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});
