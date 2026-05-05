import type { ReactNode } from "react";

type SettingsLayoutProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  aside: ReactNode;
};

export function SettingsLayout({
  title = "Settings",
  description = "Manage your account and application preferences",
  children,
  aside,
}: SettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">{title}</h1>
        <p className="text-body text-content-muted">{description}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
        <aside className="flex min-w-0 flex-col gap-6">{aside}</aside>
      </div>
    </div>
  );
}
