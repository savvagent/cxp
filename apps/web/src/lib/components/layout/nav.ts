// The console's navigation, framework-free: which item a path makes active and
// what the header calls the page. Ported from the React console's sidebar, mobile nav
// and header, where React Router's paths had no `/console` prefix.

/** The console's base path, as the browser's `pathname` carries it. */
export const CONSOLE_BASE_PATH = "/console";

/** The sidebar's top-level items. */
export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/tickets", label: "Tickets" },
  { to: "/feedback", label: "Feedback" },
  { to: "/surveys", label: "Surveys" },
] as const;

/** The sidebar's catalog section. */
export const CATALOG_ITEMS = [
  { to: "/catalog/experiences", label: "Experiences" },
  { to: "/catalog/applications", label: "Applications" },
  { to: "/catalog/pages", label: "Pages" },
  { to: "/catalog/components", label: "Components" },
] as const;

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

const ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  [...NAV_ITEMS, ...CATALOG_ITEMS].map(({ to, label }) => [to, label]),
);

/** The header's title for a path: its first two segments, else its first, else "CXP". */
export function routeTitle(pathname: string): string {
  const segments = consolePath(pathname).split("/").filter(Boolean);
  const firstTwo = "/" + segments.slice(0, 2).join("/");
  const first = "/" + (segments[0] ?? "");
  return ROUTE_TITLES[firstTwo] || ROUTE_TITLES[first] || "CXP";
}
