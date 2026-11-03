// How the console reports a failed request: one toast, with the text each page
// has always shown.
import { toast } from "svelte-sonner";

/**
 * What the toast says:
 * - `"message"`: the server's message, else `fallback` (the customer pages);
 * - `"prefix"`: `fallback: <the server's message>`, else `fallback` (the
 *   catalog and survey pages, e.g. "Failed: …", "Failed to delete: …");
 * - `"fixed"`: always `fallback` (the ticket pages).
 */
export type ToastErrorMode = "message" | "prefix" | "fixed";

/** The server's message the toast carries, or `null` when it shows `fallback` alone. */
function shownMessage(err: unknown, mode: ToastErrorMode): string | null {
  return mode !== "fixed" && err instanceof Error && err.message ? err.message : null;
}

/** The text {@link toastError} shows for `err`. */
export function errorText(err: unknown, fallback: string, mode: ToastErrorMode = "message"): string {
  const message = shownMessage(err, mode);
  if (message === null) return fallback;
  return mode === "prefix" ? `${fallback}: ${message}` : message;
}

/**
 * Shows a failed request as an error toast (see {@link ToastErrorMode}). When
 * the toast does not carry the server's message, the error is logged, so it
 * is never swallowed.
 */
export function toastError(err: unknown, fallback: string, mode: ToastErrorMode = "message"): void {
  if (shownMessage(err, mode) === null) console.error(err);
  toast.error(errorText(err, fallback, mode));
}
