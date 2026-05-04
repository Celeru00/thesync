import Link from "next/link";
import { ArrowRight, Layers3, LogIn, UserRoundPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const landingCards = [
  {
    title: "Student portal shell",
    description:
      "Shared sidebar layout is now applied to the student routes and ready for real feature screens.",
  },
  {
    title: "Auth routes",
    description:
      "Login and registration placeholders stay outside the app shell for cleaner onboarding flows.",
  },
  {
    title: "Design system",
    description:
      "The existing design system showcase is preserved on its own route for reference during implementation.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-primary-tint via-background to-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Badge variant="secondary">Landing Placeholder</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-heading">
                ThesisSync now has a shared sidebar shell for portal pages, with
                landing and auth kept outside that layout.
              </h1>
              <p className="max-w-2xl text-body">
                This page is a temporary landing screen while the rest of the
                product is being built out. Use the links below to move between
                the student portal, auth routes, and design system reference.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/student">
                  Open Student Portal
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn />
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">
                  <UserRoundPlus />
                  Register
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/design-system">
                  <Layers3 />
                  Design System
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-brand-subtle bg-surface-frosted backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Current route map</CardTitle>
              <CardDescription>
                Initial placeholders created for the main application sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-body-sm">
              <div>`/` landing placeholder</div>
              <div>`/login` and `/register` auth placeholders</div>
              <div>`/student` dashboard placeholder</div>
              <div>`/student/calendar` calendar placeholder</div>
              <div>`/student/consultations` consultations placeholder</div>
              <div>`/student/notifications` notifications placeholder</div>
              <div>`/student/settings` settings placeholder</div>
              <div>`/design-system` design reference</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {landingCards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
