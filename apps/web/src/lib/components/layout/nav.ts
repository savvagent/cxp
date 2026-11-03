// The console's navigation, framework-free: the sidebar's, the mobile nav's
// and the command palette's items, which item a path makes active, and what
// the header calls the page. Paths are within the console (no `/console`).
//
// Each label is a getter over its message: these lists are built when the
// module loads, before the root layout resolves the locale, so a plain string
// here would always be English.
import { m } from "#lib/paraglide/messages.js";

/** The console's base path, as the browser's `pathname` carries it. */
export const CONSOLE_BASE_PATH = "/console";

/** One navigation item: its path, and its label in the active locale. */
function navItem<const To extends string>(to: To, label: () => string): { readonly to: To; readonly label: string } {
  return {
    to,
    get label() {
      return label();
    },
  };
}

/** The sidebar's top-level items. */
export const NAV_ITEMS = [
  navItem("/dashboard", m.nav_dashboard),
  navItem("/customers", m.nav_customers),
  navItem("/tickets", m.nav_tickets),
  navItem("/feedback", m.nav_feedback),
  navItem("/surveys", m.nav_surveys),
] as const;

/** The sidebar's catalog section. */
export const CATALOG_ITEMS = [
  navItem("/catalog/experiences", m.nav_experiences),
  navItem("/catalog/applications", m.nav_applications),
  navItem("/catalog/pages", m.nav_pages),
  navItem("/catalog/components", m.nav_components),
] as const;

/** The catalog section's heading. */
export const catalogLabel = (): string => m.nav_catalog();

/** The command palette's navigation: the top-level items, then the catalog (its first level). */
export const PALETTE_ITEMS = [...NAV_ITEMS, navItem(CATALOG_ITEMS[0].to, m.nav_catalog)] as const;

/** Every route the navigation links to. */
export type NavPath = (typeof NAV_ITEMS)[number]["to"] | (typeof CATALOG_ITEMS)[number]["to"];

/** The path within the console: `/console/tickets/1` is `/tickets/1`, `/console` is `/`. */
export function consolePath(pathname: string): string {
  if (pathname === CONSOLE_BASE_PATH) return "/";
  if (pathname.startsWith(`${CONSOLE_BASE_PATH}/`)) {
    return pathname.slice(CONSOLE_BASE_PATH.length);
  }
  return pathname;
}

/**
 * Whether the item linking to `to` is the current one, as React Router's
 * `NavLink` decided: the path is `to` itself or below it.
 */
export function isNavActive(pathname: string, to: NavPath): boolean {
  const path = consolePath(pathname).replace(/\/+$/, "") || "/";
  return path === to || path.startsWith(`${to}/`);
}

const ROUTE_ITEMS: readonly { to: string; label: string }[] = [...NAV_ITEMS, ...CATALOG_ITEMS];

function routeLabel(path: string): string | undefined {
  return ROUTE_ITEMS.find((item) => item.to === path)?.label;
}

/** The header's title for a path: its first two segments, else its first, else "CXP". */
export function routeTitle(pathname: string): string {
  const segments = consolePath(pathname).split("/").filter(Boolean);
  const firstTwo = "/" + segments.slice(0, 2).join("/");
  const first = "/" + (segments[0] ?? "");
  return routeLabel(firstTwo) || routeLabel(first) || "CXP";
}
