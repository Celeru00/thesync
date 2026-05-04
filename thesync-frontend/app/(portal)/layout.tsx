import type { ReactNode } from "react";

import { PortalSidebar } from "@/components/app/portal-sidebar";

export default function PortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-page">
      <div className="flex min-h-screen flex-col md:flex-row">
        <PortalSidebar />
        <main className="min-w-0 flex-1">
          <div className="flex min-h-screen w-full flex-col px-6 py-8 lg:px-10 lg:py-10 2xl:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
