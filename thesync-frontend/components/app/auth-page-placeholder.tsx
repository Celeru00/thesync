import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthPagePlaceholderProps = {
  badge: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
};

export function AuthPagePlaceholder({
  badge,
  title,
  description,
  alternateHref,
  alternateLabel,
}: AuthPagePlaceholderProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-primary-tint via-background to-background px-6 py-10">
      <Card className="w-full max-w-xl border-brand-subtle shadow-elevated">
        <CardHeader className="space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand text-brand-on shadow-glow">
            <ShieldCheck className="size-7" />
          </div>
          <div className="space-y-3">
            <Badge variant="secondary">{badge}</Badge>
            <CardTitle className="text-heading">{title}</CardTitle>
            <CardDescription className="text-body">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/student">
              Open Student Portal
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={alternateHref}>{alternateLabel}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft />
              Back to landing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
