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

const portalSidebarItems: SidebarItem[] = [
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

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      brandName="TheSync"
      brandSubtitle="Student Portal"
      brandHref="/student"
      items={portalSidebarItems}
      activeHref={pathname}
      user={{
        name: "John Doe",
        email: "john.doe@upm.edu",
        initials: "JD",
      }}
      logoutHref="/login"
      className="min-h-fit w-full md:min-h-screen md:w-[17rem] md:shrink-0 md:self-stretch"
    />
  );
}
