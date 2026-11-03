/**
 * Which language the console renders in.
 *
 * The same resolution as the platform console's `lib/locale.ts`, with the same
 * API, so the shared `@savvagent/console-ui` shell can rely on one behavior in
 * every console (savvagent/platform#154):
 *
 * | Tier | Holds | Authority |
 * |---|---|---|
 * | the account's locale | the account's explicit choice, or `null` | **source of truth** |
 * | `localStorage` (`otto.locale`) | a copy of it, for first paint | cache only |
 * | `navigator.languages` | the browser's preference | fallback when nothing was chosen |
 *
 * CXP's `/auth/session` does not carry the platform account's locale yet, so
 * today the console resolves from the cache, then the browser, then `en`.
 * [`reconcile`] is the entry point for the account's choice once the session
 * returns it; until then nothing calls it with a value, and nothing reloads.
 *
 * **A locale change reloads the document.** Paraglide's `m.*()` are plain
 * function calls, not reactive reads, so Svelte has no dependency to invalidate
 * when the locale changes underneath them. Somebody changes their language
 * roughly once per account, so the reload costs almost nothing and removes a
 * whole class of half-translated-screen bugs. It is also why every message is
 * read when it is shown, never into a module-level constant: a module is
 * evaluated before [`resolveAtBoot`] runs, and would hold the base locale.
 */

import { baseLocale, locales, overwriteGetLocale } from '#lib/paraglide/runtime.js';

export type Locale = (typeof locales)[number];

/**
 * The supported locales, taken from Paraglide's generated runtime.
 *
 * Never re-typed here. That runtime is generated from
 * `project.inlang/settings.json`, which lists the same locales as the platform
 * console's (a test in `scripts/check-messages.test.mjs` pins the list).
 */
export const SUPPORTED: readonly Locale[] = locales;

/** What each language calls itself. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  hi: 'हिन्दी'
};

const CACHE_KEY = 'otto.locale';

export function isSupported(value: string | null | undefined): value is Locale {
  return value != null && (SUPPORTED as readonly string[]).includes(value);
}

/** Just the part of `Storage` used here, so a test can supply a hostile one. */
export interface LocaleStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * `localStorage`, defensively.
 *
 * Reads and writes are wrapped because the accessor itself throws — not just
 * returns null — when a browser is set to block site data, and in some private
 * modes. The console degrades to detecting the language on every load, which is
 * a worse experience than remembering it and a much better one than a blank
 * page.
 */
export function readCached(store: LocaleStore | undefined = browserStore()): Locale | undefined {
  try {
    const stored = store?.getItem(CACHE_KEY);
    return isSupported(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function writeCached(
  locale: Locale | undefined,
  store: LocaleStore | undefined = browserStore()
): void {
  try {
    if (locale === undefined) store?.removeItem(CACHE_KEY);
    else store?.setItem(CACHE_KEY, locale);
  } catch {
    // Nothing to do. The next load detects again.
  }
}

/**
 * `localStorage`, or nothing.
 *
 * Reaching for the property is itself what throws when a browser is set to
 * block site data — not merely reading from it — so even acquiring the handle
 * goes inside a `try`.
 */
function browserStore(): LocaleStore | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

/**
 * The best supported match for what the browser says it wants.
 *
 * Matches on the primary subtag, so `es-419` and `es-MX` are both Spanish —
 * the same rule the platform console and server apply. Refusing a region-qualified tag would hand English to a
 * browser that was perfectly clear about what it wanted.
 */
export function detect(preferences: readonly string[] = navigator.languages ?? []): Locale {
  for (const tag of preferences) {
    const primary = tag.split(/[-_]/)[0]?.toLowerCase();
    if (isSupported(primary)) return primary;
  }
  return baseLocale as Locale;
}

/** The locale this document is rendering in. Resolved once, before first paint. */
let current: Locale = baseLocale as Locale;

export function currentLocale(): Locale {
  return current;
}

/**
 * Decide the language and tell Paraglide about it — synchronously, before
 * anything renders.
 *
 * `overwriteGetLocale` rather than one of Paraglide's built-in strategies
 * because none of them can read an account field, and the ones that could get
 * close (`cookie`, `url`) would either need the server to set them or would put
 * a locale segment in every path under `/console/`, which `adapter-static` has
 * no server to route. Called at the top of the root layout's script, which
 * runs before anything renders and needs no inline script (the server's CSP is
 * `script-src 'self'`).
 */
export function resolveAtBoot(): Locale {
  current = readCached() ?? detect();
  overwriteGetLocale(() => current);
  applyLang(current);
  return current;
}

/**
 * Set `<html lang>`.
 *
 * `app.html` says `en`, and every console path is served that one
 * `index.html`. The console's language comes from the browser (and later the
 * account), which no build step can know, so the attribute is corrected from
 * script, in the same synchronous step that resolves the locale. The shell is
 * empty until JS runs, so there is nothing yet to mispronounce.
 */
function applyLang(locale: Locale): void {
  document.documentElement.lang = locale;
}

/**
 * Reconcile the account's stored choice with what this document is rendering.
 *
 * To be called once the session carries the account's locale (it does not
 * yet: a follow-up to savvagent/cxp#81). `null` means the account has chosen
 * nothing and browser detection stays in charge — it is emphatically not
 * "English"; `undefined` means no answer yet, and changes nothing.
 *
 * **This cannot loop, and the write order is the reason.** The cache is written
 * *before* the reload, so the next boot resolves to exactly the value that
 * triggered this one and the comparison that fired is false. Reloading twice
 * would require the server's answer to change between two loads, which is a
 * real change made on another device, not a loop.
 */
export function reconcile(stored: string | null | undefined): void {
  if (!needsReload(stored, current)) return;
  writeCached(isSupported(stored) ? stored : undefined);
  location.reload();
}

/**
 * Whether the account's stored choice disagrees with what this document is
 * rendering.
 *
 * Split out from [`reconcile`] so the termination argument is testable without
 * a browser: the caller writes `stored` to the cache *before* reloading, so the
 * next boot resolves `current` to `stored`, and `needsReload(stored, stored)`
 * is false. A second reload would need the server's answer to change between
 * two loads — a real change made on another device, not a loop.
 *
 * A `null` server answer still needs a reload if a *stale* cache is why this
 * document is rendering `rendering` at all — otherwise clearing the choice on
 * another device would never take effect here, since the cache would keep
 * winning over browser detection on every future boot.
 */
export function needsReload(
  stored: string | null | undefined,
  rendering: Locale,
  cached: Locale | undefined = readCached()
): boolean {
  // `undefined` is "no information yet" — before the session resolves, while
  // it carries no locale, and when signed out — not the account telling us
  // anything. Only a resolved `null`
  // is that: reload's whole reason to exist is reacting to what the server
  // said, and it has not said anything yet.
  if (stored === undefined) return false;
  if (isSupported(stored)) return stored !== rendering;
  // `null` means the account chose nothing, which leaves browser detection in
  // charge. It is not a request to switch to English — but a lingering cache
  // entry from a choice that was since cleared has to go.
  return cached !== undefined;
}

/**
 * Apply a choice the user just made in the picker.
 *
 * For the shared header's language picker (`@savvagent/console-ui`), called
 * only after the account's choice has been saved, never optimistically: a
 * locale the platform refuses must not leave the console speaking a language
 * the account does not actually have.
 *
 * `undefined` is "match my browser" — the cache is cleared so the next boot
 * detects again.
 */
export function applyLocale(next: Locale | undefined): void {
  writeCached(next);
  location.reload();
}
