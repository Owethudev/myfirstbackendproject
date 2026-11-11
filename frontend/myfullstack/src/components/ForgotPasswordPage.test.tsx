import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const createResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("ForgotPasswordPage request states", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows loading and generic success feedback for a submitted request", async () => {
    const request = createDeferred<Response>();
    const fetchMock = vi.fn(() => request.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    await act(async () => {
      request.resolve(
        createResponse(200, {
          message:
            "If an account exists with that email, we'll try to send a password reset link. If it doesn't arrive, submit another request; only the newest link will work.",
        }),
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /only the newest link will work/i,
    );
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/forgot-password"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "member@example.test" }),
      }),
    );
  });

  it("retains the email and allows retry after a transport failure", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(
        createResponse(200, { message: "Reset request accepted." }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable");
    expect(screen.getByLabelText("Email")).toHaveValue("member@example.test");
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Reset request accepted.");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});
