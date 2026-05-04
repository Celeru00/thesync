import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PortalPagePlaceholderProps = {
  badge: string;
  title: string;
  description: string;
  pathLabel: string;
  icon: LucideIcon;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  notes: string[];
};

export function PortalPagePlaceholder({
  badge,
  title,
  description,
  pathLabel,
  icon: Icon,
  primaryAction,
  secondaryAction,
  notes,
}: PortalPagePlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-4">
        <Badge variant="secondary">{badge}</Badge>
        <div className="space-y-3">
          <h1 className="text-heading">{title}</h1>
          <p className="max-w-3xl text-body">{description}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-brand-subtle shadow-elevated">
          <CardContent className="px-6 py-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-on shadow-glow">
                  <Icon className="size-7" />
                </div>
                <div className="space-y-2">
                  <div className="text-label">Placeholder content</div>
                  <p className="max-w-2xl text-body-sm">
                    This route is wired into the shared sidebar shell. You can
                    replace the placeholder blocks here with real page content
                    without rebuilding the layout structure.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-surface bg-surface-muted px-4 py-3 text-body-sm">
                <div className="text-label">Route</div>
                <div>{pathLabel}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>
              Quick links to keep building the flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight />
              </Link>
            </Button>
            {secondaryAction ? (
              <Button asChild variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suggested content</CardTitle>
            <CardDescription>
              Typical modules that can live on this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notes.map((note) => (
              <div key={note} className="flex items-start gap-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand">
                  <FolderKanban className="size-4" />
                </div>
                <p className="text-body-sm">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template status</CardTitle>
            <CardDescription>
              The shared shell is ready and this page can be implemented
              incrementally.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-surface bg-surface-muted px-4 py-4">
              <div className="flex items-center gap-3">
                <Clock3 className="size-5 text-brand" />
                <span className="text-label">Structure complete</span>
              </div>
              <p className="mt-2 text-body-sm">
                Navigation, page spacing, and route-level composition are in
                place for this screen.
              </p>
            </div>
            <div className="rounded-2xl border border-surface bg-surface-muted px-4 py-4">
              <div className="text-label">Implementation note</div>
              <p className="mt-2 text-body-sm">
                Keep feature-specific data fetching in the page or nested
                components. The shared layout should stay focused on app-shell
                concerns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
