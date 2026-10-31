import "server-only";
import type { Viewer } from "./viewer";
import { hasPlatformRole, inClientWorkspace, inEmployeeWorkspace, isClientAdmin } from "./policy";

export type NavItem = { href: string; label: string; icon: string; group: string };

// The menu is a convenience. It is never a source of authority: each page re-checks access.
export function portalNav(v: Viewer): NavItem[] {
  const items: NavItem[] = [{ href: "/portal", label: "Dashboard", icon: "home", group: "Workspace" }];
  if (inEmployeeWorkspace(v)) {
    items.push(
      { href: "/portal/playground", label: "Playground", icon: "flask", group: "Workspace" },
      { href: "/portal/live", label: "Live & recordings", icon: "radio", group: "Workspace" },
      { href: "/portal/library", label: "Knowledge library", icon: "book", group: "Workspace" },
      { href: "/portal/innovation", label: "Innovation", icon: "sparkles", group: "Workspace" },
      { href: "/portal/learning", label: "Shared learning", icon: "network", group: "Learning" },
      { href: "/portal/learning/themes", label: "Themes", icon: "layers", group: "Learning" },
      { href: "/portal/ideas", label: "Improvement ideas", icon: "lightbulb", group: "Learning" },
    );
    if (hasPlatformRole(v, "learning_moderator")) items.push({ href: "/portal/moderation", label: "Moderation", icon: "shield", group: "Manage" });
    if (hasPlatformRole(v, "content_publisher")) items.push({ href: "/portal/publisher", label: "Publishing", icon: "megaphone", group: "Manage" });
    if (hasPlatformRole(v, "fl_coordinator") || hasPlatformRole(v, "portal_admin")) items.push({ href: "/portal/fl", label: "Federated learning", icon: "cpu", group: "Manage" });
    if (hasPlatformRole(v, "portal_admin")) items.push({ href: "/portal/admin", label: "Administration", icon: "settings", group: "Manage" });
  } else if (inClientWorkspace(v)) {
    items.push(
      { href: "/portal/playground", label: "Sandbox demos", icon: "flask", group: "Workspace" },
      { href: "/portal/live", label: "Sessions", icon: "radio", group: "Workspace" },
      { href: "/portal/library", label: "Resources", icon: "book", group: "Workspace" },
      { href: "/portal/observations", label: "Observations", icon: "pen", group: "Learning" },
      { href: "/portal/learning", label: "Shared learning", icon: "network", group: "Learning" },
      { href: "/portal/learning/themes", label: "Themes", icon: "layers", group: "Learning" },
      { href: "/portal/ideas", label: "Improvement ideas", icon: "lightbulb", group: "Learning" },
      { href: "/portal/support", label: "Support", icon: "lifebuoy", group: "Organisation" },
    );
    if (isClientAdmin(v)) items.push({ href: "/portal/org", label: "Members & access", icon: "users", group: "Organisation" });
  }
  items.push({ href: "/portal/aira", label: "Ask AIRA", icon: "bot", group: "Assist" });
  return items;
}
