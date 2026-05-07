import * as React from "react";
import Link from "next/link";
import { LogOut, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
};

export type SidebarUser = {
  name: string;
  email: string;
  initials?: string;
  avatarUrl?: string | null;
};

type SidebarProps = Omit<React.ComponentProps<"aside">, "title"> & {
  brandName: string;
  brandSubtitle?: string;
  brandHref?: string;
  items: SidebarItem[];
  activeHref?: string;
  user?: SidebarUser;
  logoutHref?: string;
  logoutLabel?: string;
};

const sidebarTheme = {
  "--sidebar": "#243248",
  "--sidebar-foreground": "#f8fafc",
  "--sidebar-primary": "#3568ea",
  "--sidebar-primary-foreground": "#ffffff",
  "--sidebar-accent": "rgb(255 255 255 / 0.08)",
  "--sidebar-accent-foreground": "#f8fafc",
  "--sidebar-border": "rgb(255 255 255 / 0.10)",
  "--sidebar-ring": "#93c5fd",
} as React.CSSProperties;

function isItemActive(item: SidebarItem, activeHref?: string) {
  if (!activeHref) {
    return false;
  }

  if (item.match === "prefix") {
    return activeHref === item.href || activeHref.startsWith(`${item.href}/`);
  }

  return activeHref === item.href;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarAvatar({ user }: { user: SidebarUser }) {
  const initials = user.initials ?? getInitials(user.name);

  if (!user.avatarUrl) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={user.avatarUrl}
      alt={`${user.name} profile`}
      className="size-10 shrink-0 rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  );
}

function Sidebar({
  brandName,
  brandSubtitle,
  brandHref,
  items,
  activeHref,
  user,
  logoutHref,
  logoutLabel = "Logout",
  className,
  style,
  ...props
}: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "flex min-h-screen w-[17rem] max-w-full flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
      style={{ ...sidebarTheme, ...style }}
      {...props}
    >
      <div
        data-slot="sidebar-header"
        className="border-b border-sidebar-border px-6 py-7"
      >
        {brandHref ? (
          <Link
            href={brandHref}
            className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sidebar-ring/20"
          >
            <BrandBlock name={brandName} subtitle={brandSubtitle} />
          </Link>
        ) : (
          <BrandBlock name={brandName} subtitle={brandSubtitle} />
        )}
      </div>

      <nav
        data-slot="sidebar-nav"
        aria-label="Primary navigation"
        className="flex-1 px-4 py-6"
      >
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, activeHref);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-2xl px-4 text-[1.0625rem] font-medium transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sidebar-ring/20",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_40px_-28px_rgb(53_104_234/0.95)]"
                      : "text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        data-slot="sidebar-footer"
        className="mt-auto border-t border-sidebar-border px-4 py-5"
      >
        {user ? (
          <div
            data-slot="sidebar-user"
            className="flex items-center gap-3 rounded-2xl px-2 py-3"
          >
            <SidebarAvatar user={user} />
            <div className="min-w-0">
              <div className="truncate text-label font-medium text-sidebar-foreground">
                {user.name}
              </div>
              <div className="truncate text-sm text-sidebar-foreground/60">
                {user.email}
              </div>
            </div>
          </div>
        ) : null}

        {logoutHref ? (
          <Link
            href={logoutHref}
            className="flex h-11 items-center gap-3 rounded-2xl px-3 text-[1.0625rem] font-medium text-sidebar-foreground/78 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-4 focus-visible:ring-sidebar-ring/20"
          >
            <LogOut className="size-5 shrink-0" />
            <span>{logoutLabel}</span>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function BrandBlock({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[2.125rem] leading-none font-semibold tracking-[-0.03em] text-sidebar-foreground">
        {name}
      </div>
      {subtitle ? (
        <div className="text-sm leading-5 text-sidebar-foreground/60">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export { Sidebar };
