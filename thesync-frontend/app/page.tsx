import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-page text-page">
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-primary-tint/55 via-background to-background"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary-tint via-white to-background opacity-90 blur-3xl"
      />

      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-surface bg-surface-frosted backdrop-blur-sm">
          <div className="flex w-full items-center justify-between px-8 py-[1.1rem] lg:px-9">
            <Link
              href="/"
              className="inline-flex items-center gap-3.5 rounded-2xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-focus"
            >
              <LogoMark className="size-[3.1rem] rounded-[1rem] [&_svg]:size-[1.35rem]" />
              <BrandWordmark className="text-[2rem] leading-none" />
            </Link>

            <Button asChild size="sm" className="rounded-[0.9rem] px-4">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center px-6 py-14 sm:py-16">
          <div className="flex w-full max-w-[42rem] flex-col items-center pb-2 text-center">
            <LogoMark className="mb-5 size-[3.75rem] rounded-[1.15rem] [&_svg]:size-[1.7rem]" />

            <h1 className="text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.045em] text-content-strong sm:text-[3.35rem]">
              <BrandWordmark />
            </h1>

            <p className="mt-4 max-w-[31rem] text-[1.05rem] leading-[1.65] font-normal text-content-muted sm:max-w-[35rem] sm:text-[1.1rem]">
              A centralized scheduling system for thesis consultations and
              defense coordination
            </p>

            <div className="mt-8 flex w-full max-w-[28.125rem] flex-col items-center">
              <Button
                asChild
                size="lg"
                className="h-[3rem] w-full rounded-[1rem] text-[1.05rem] shadow-elevated"
              >
                <Link href="/login">
                  <span
                    data-icon="inline-start"
                    className="inline-flex items-center justify-center text-[1.4rem] leading-none font-semibold text-brand-on"
                  >
                    G
                  </span>
                  Sign in with UP Email
                </Link>
              </Button>

              <p className="mt-3 text-[0.95rem] leading-6 text-content-muted">
                Requires @up.edu.ph email address
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-surface bg-surface-frosted backdrop-blur-sm">
          <div className="flex w-full flex-col gap-4 px-8 py-7 sm:flex-row sm:items-end sm:justify-between lg:px-9">
            <div className="flex items-center gap-3">
              <LogoMark className="size-[2.5rem] rounded-[0.95rem] [&_svg]:size-[1.05rem]" />
              <BrandWordmark className="text-[1.65rem] leading-none" />
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <p className="text-[1.05rem] leading-7 font-medium text-content">
                CMSC 186 Project - DMPCS, UP Mindanao
              </p>
              <p className="text-[0.9rem] leading-6 text-content-muted">
                &copy; 2026 ThesisSync. Built for UP Mindanao academic
                community.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={`flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-on shadow-glow ${className ?? ""}`}
    >
      <CalendarDays className="size-6" />
    </div>
  );
}

function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[-0.045em] ${className ?? ""}`}>
      <span className="text-content-strong">Thesis</span>
      <span className="text-brand">Sync</span>
    </span>
  );
}
