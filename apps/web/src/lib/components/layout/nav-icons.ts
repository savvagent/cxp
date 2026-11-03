// Each navigation item's icon, shared by the sidebar and the mobile nav.
import AppWindow from "@lucide/svelte/icons/app-window";
import ClipboardList from "@lucide/svelte/icons/clipboard-list";
import FileText from "@lucide/svelte/icons/file-text";
import Layers from "@lucide/svelte/icons/layers";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import MessageSquare from "@lucide/svelte/icons/message-square";
import Puzzle from "@lucide/svelte/icons/puzzle";
import Ticket from "@lucide/svelte/icons/ticket";
import Users from "@lucide/svelte/icons/users";
import type { Component } from "svelte";
import type { NavPath } from "./nav.js";

export const NAV_ICONS: Record<NavPath, Component<{ class?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/customers": Users,
  "/tickets": Ticket,
  "/feedback": MessageSquare,
  "/surveys": ClipboardList,
  "/catalog/experiences": Layers,
  "/catalog/applications": AppWindow,
  "/catalog/pages": FileText,
  "/catalog/components": Puzzle,
};
