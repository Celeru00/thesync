"use client";

import {
  Bell,
  CalendarDays,
  CalendarRange,
  FileText,
  LayoutDashboard,
  Settings2,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Sidebar, type SidebarItem } from "@/components/ui/sidebar";
import type { AppSessionUser } from "@/lib/auth/backend";

const studentSidebarItems: SidebarItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/student/consultations",
    label: "Consultations",
    icon: FileText,
    match: "prefix",
  },
  {
    href: "/student/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/student/settings", label: "Settings", icon: Settings2 },
];

const adviserSidebarItems: SidebarItem[] = [
  { href: "/adviser", label: "Dashboard", icon: LayoutDashboard },
  { href: "/adviser/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/adviser/consultations",
    label: "Consultations",
    icon: FileText,
    match: "prefix",
  },
  {
    href: "/adviser/availability",
    label: "Availability",
    icon: CalendarRange,
  },
  {
    href: "/adviser/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/adviser/settings", label: "Settings", icon: Settings2 },
];

const adminSidebarItems: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/admin/consultations",
    label: "Consultations",
    icon: FileText,
    match: "prefix",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

const portalConfigs = {
  admin: {
    brandSubtitle: "Admin Portal",
    brandHref: "/admin",
    items: adminSidebarItems,
  },
  adviser: {
    brandSubtitle: "Adviser Portal",
    brandHref: "/adviser",
    items: adviserSidebarItems,
  },
  student: {
    brandSubtitle: "Student Portal",
    brandHref: "/student",
    items: studentSidebarItems,
  },
} as const;

type PortalSidebarProps = {
  currentUser: AppSessionUser;
};

export function PortalSidebar({ currentUser }: PortalSidebarProps) {
  const pathname = usePathname();
  const config = portalConfigs[currentUser.app_role];

  return (
    <Sidebar
      brandName="TheSync"
      brandSubtitle={config.brandSubtitle}
      brandHref={config.brandHref}
      items={config.items}
      activeHref={pathname}
      user={{
        name: currentUser.full_name,
        email: currentUser.email,
      }}
      logoutHref="/auth/signout"
      className="min-h-fit w-full md:sticky md:top-0 md:h-screen md:w-68 md:shrink-0 md:self-start md:overflow-y-auto"
    />
  );
}
