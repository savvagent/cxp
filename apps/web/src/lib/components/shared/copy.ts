// What `CopyableId` does when clicked, kept free of Svelte and the DOM so it
// can be tested without either.
import { m } from "#lib/paraglide/messages.js";

/** How long the copied tick shows before the copy icon comes back. */
export const COPIED_MS = 2000;

/** The part of an id `CopyableId` shows: its first eight characters. */
export function shortId(value: string): string {
  return value.slice(0, 8);
}

export interface CopyDeps {
  /** Writes text to the clipboard; absent where the browser offers none (an insecure origin). */
  writeText: ((text: string) => Promise<void>) | undefined;
  /** Shows or hides the copied tick. */
  setCopied: (copied: boolean) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  schedule: (fn: () => void, ms: number) => unknown;
}

/**
 * Copies `value`, then shows the tick and a "Copied!" toast for `COPIED_MS`.
 * A clipboard that is missing or refuses gets an error toast instead of
 * failing silently. Resolves to whether the copy happened.
 */
export async function copyValue(value: string, deps: CopyDeps): Promise<boolean> {
  try {
    if (!deps.writeText) throw new Error("no clipboard");
    await deps.writeText(value);
  } catch {
    deps.error(m.copy_failed());
    return false;
  }
  deps.setCopied(true);
  deps.success(m.copy_done());
  deps.schedule(() => deps.setCopied(false), COPIED_MS);
  return true;
}
