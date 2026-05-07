import type { ReactNode } from "react";

import { PortalNotificationBell } from "@/components/app/portal-notification-bell";
import { PortalSidebar } from "@/components/app/portal-sidebar";
import { getAuthAvatarUrl } from "@/lib/auth/profile";
import { getRequiredAppUser, getServerAuthState } from "@/lib/auth/server";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const currentUser = await getRequiredAppUser();
  const { authUser } = await getServerAuthState();
  const sidebarAvatarUrl = currentUser.avatar_url ?? getAuthAvatarUrl(authUser);

  return (
    <div className="min-h-screen bg-page">
      <div className="flex min-h-screen flex-col md:flex-row">
        <PortalSidebar currentUser={currentUser} avatarUrl={sidebarAvatarUrl} />
        <main className="min-w-0 flex-1">
          <div className="relative flex min-h-screen w-full flex-col px-6 py-8 lg:px-10 lg:py-10 2xl:px-12">
            <div className="absolute right-6 top-6 z-30 lg:right-10 lg:top-10 2xl:right-12">
              <PortalNotificationBell currentUser={currentUser} />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
