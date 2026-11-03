import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("svelte-sonner", () => ({ toast: { error: (text: string) => toastError(text) } }));

const { errorText, toastError: show } = await import("./errors");
const { ApiError } = await import("./api-error");

afterEach(() => {
  toastError.mockReset();
  vi.restoreAllMocks();
});

describe("errorText", () => {
  const err = new ApiError(500, "boom");

  it("shows the server's message, else the fallback", () => {
    expect(errorText(err, "Failed to create customer")).toBe("boom");
    expect(errorText("nope", "Failed to create customer")).toBe("Failed to create customer");
    expect(errorText(new Error(""), "Failed to create customer")).toBe("Failed to create customer");
  });

  it("prefixes the server's message", () => {
    expect(errorText(err, "Failed", "prefix")).toBe("Failed: boom");
    expect(errorText(err, "Failed to delete", "prefix")).toBe("Failed to delete: boom");
    expect(errorText(undefined, "Failed", "prefix")).toBe("Failed");
  });

  it("keeps a fixed text", () => {
    expect(errorText(err, "Failed to create ticket", "fixed")).toBe("Failed to create ticket");
  });
});

describe("toastError", () => {
  it("toasts the server's message without logging", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    show(new ApiError(400, "Email taken"), "Failed to create customer");
    expect(toastError).toHaveBeenCalledWith("Email taken");
    expect(log).not.toHaveBeenCalled();
  });

  it("logs the error when the toast does not carry it", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new ApiError(500, "boom");
    show(err, "Failed to delete ticket", "fixed");
    expect(toastError).toHaveBeenCalledWith("Failed to delete ticket");
    expect(log).toHaveBeenCalledWith(err);
  });
});
