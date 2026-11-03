// The console is a static single-page app: nothing renders on a server, and
// every page is built in the browser from the one `index.html` fallback.
export const ssr = false;
export const prerender = false;
// `/console/tickets`, never `/console/tickets/`: today's URLs, the server's
// `/console` → `/console/` redirect, and its `index.html` fallback all assume it.
export const trailingSlash = "never";
