import type { ReactNode } from "react";

import { requireAppRole } from "@/lib/auth/server";

export default async function AdviserPortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAppRole("adviser");
  return children;
}
