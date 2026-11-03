import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";

// `/console/` is the dashboard.
export function load() {
  redirect(307, resolve("/dashboard"));
}
