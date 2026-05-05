import type { ReactNode } from "react";

import { requireAppRole } from "@/lib/auth/server";

export default async function StudentPortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAppRole("student");
  return children;
}
