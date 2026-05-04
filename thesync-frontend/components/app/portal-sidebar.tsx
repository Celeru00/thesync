"use client";

import {
  Bell,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings2,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Sidebar, type SidebarItem } from "@/components/ui/sidebar";

const studentSidebarItems: SidebarItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/student/consultations",
    label: "Consultations",
    icon: FileText,
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
  },
  {
    href: "/adviser/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/adviser/settings", label: "Settings", icon: Settings2 },
];

const portalConfigs = {
  adviser: {
    brandSubtitle: "Adviser Portal",
    brandHref: "/adviser",
    items: adviserSidebarItems,
    user: {
      name: "Prof. Maria Santos",
      email: "maria.santos@up.edu.ph",
      initials: "MS",
    },
  },
  student: {
    brandSubtitle: "Student Portal",
    brandHref: "/student",
    items: studentSidebarItems,
    user: {
      name: "John Doe",
      email: "john.doe@up.edu.ph",
      initials: "JD",
    },
  },
} as const;

function getPortalConfig(pathname: string) {
  if (pathname.startsWith("/adviser")) {
    return portalConfigs.adviser;
  }

  return portalConfigs.student;
}

export function PortalSidebar() {
  const pathname = usePathname();
  const config = getPortalConfig(pathname);

  return (
    <Sidebar
      brandName="TheSync"
      brandSubtitle={config.brandSubtitle}
      brandHref={config.brandHref}
      items={config.items}
      activeHref={pathname}
      user={config.user}
      logoutHref="/login"
      className="min-h-fit w-full md:min-h-screen md:w-[17rem] md:shrink-0 md:self-stretch"
    />
  );
}
