import type { ReactNode } from "react";

import { requireAppRole } from "@/lib/auth/server";

export default async function AdminPortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAppRole("admin");
  return children;
}
