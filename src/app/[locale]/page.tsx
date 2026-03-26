'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  ChartNoAxesCombined,
  Network,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeroVisual } from '@/components/ui/graphics/hero-visual';
import { LandingBackdrop } from '@/components/ui/graphics/landing-backdrop';
import Link from 'next/link';

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-background hover:border-primary/20 rounded-2xl border border-white/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_var(--glow-primary-sm)]">
      <Icon className="text-primary mb-6 h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
      <h3 className="text-foreground mb-3 text-lg font-bold tracking-tight uppercase">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log('Waitlist email submitted:', email);
  }

  return (
    <div className="bg-background text-foreground min-h-screen antialiased">
      <header className="bg-background fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-headline text-foreground text-xl font-light tracking-tighter">
            TourCRM
          </span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <span className="text-primary text-[11px] font-medium tracking-widest uppercase">
            Status: Private Beta
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-primary hidden h-auto rounded-xl px-4 py-2 text-[11px] tracking-widest uppercase hover:bg-transparent sm:block"
          >
            Partner Login
          </Button>
          <Button
            type="button"
            className="text-foreground rounded-xl border border-white/20 bg-transparent px-6 py-2 text-[11px] tracking-widest uppercase transition-all hover:bg-white/10 active:scale-95"
          >
            Join Waitlist
          </Button>
        </div>
      </header>

      <main className="relative overflow-hidden pt-32 pb-24">
        <LandingBackdrop />

        <section className="mx-auto max-w-7xl px-6 text-center">
          <div className="bg-secondary mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">
              Now accepting beta requests
            </span>
          </div>

          <h1 className="text-foreground mx-auto mb-8 max-w-4xl text-5xl leading-[0.95] font-bold tracking-[-0.04em] md:text-7xl lg:text-8xl">
            The Future of Tourism Management
          </h1>

          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg leading-relaxed md:text-xl">
            Organize leads, manage sales teams, and track tours in one secure,
            high-performance workspace. Request private beta access.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mb-24 flex max-w-md flex-col gap-4"
          >
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="relative w-full">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="work@company.com"
                  className="bg-background text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-primary/40 h-14 rounded-2xl border border-white/10 px-6"
                />
              </div>

              <Button
                type="submit"
                className="glow-hover kinetic-gradient h-14 w-full rounded-2xl px-8 text-xs font-bold tracking-widest text-black uppercase hover:brightness-110 sm:w-auto"
              >
                Request Access
              </Button>
            </div>

            <div className="text-center">
              <Link href="/auth/login">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground/60 hover:text-primary h-auto cursor-pointer rounded-full px-0 text-[10px] font-bold tracking-widest uppercase hover:bg-transparent"
                >
                  Existing user? Early Access Login
                </Button>
              </Link>
            </div>
          </form>

          <HeroVisual imageAlt="abstract digital connection network with glowing teal lines and nodes on a dark tech background" />
        </section>

        <section className="mx-auto mb-32 max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Network}
              title="Unified Operations"
              description="Consolidate your entire travel ecosystem into a single, lightning-fast dashboard designed for high-volume agencies."
            />
            <FeatureCard
              icon={ChartNoAxesCombined}
              title="Precision Analytics"
              description="Real-time tracking of agent performance and tour profitability with granular reporting modules."
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Trust"
              description="End-to-end encryption for client data and secure multi-role access controls for growing sales teams."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6">
          <div className="bg-secondary relative overflow-hidden rounded-2xl border border-white/10 p-12 text-center md:p-24">
            <div className="bg-primary/5 absolute inset-0 translate-y-32 -skew-y-12" />
            <h2 className="tight-tracking text-foreground relative z-10 mb-8 text-3xl font-bold md:text-5xl">
              Limited Beta Availability.
            </h2>
            <p className="text-muted-foreground relative z-10 mx-auto mb-12 max-w-xl">
              We are currently onboarding a select group of agencies to our
              private testing phase. Secure your spot in the future of tour
              management.
            </p>
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                type="button"
                className="bg-primary text-primary-foreground shadow-primary/10 rounded-xl px-12 py-4 text-xs font-bold tracking-[0.2em] uppercase shadow-lg transition-all hover:brightness-110 active:scale-95"
              >
                Join Waitlist
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground rounded-xl border border-white/20 px-12 py-4 text-xs font-bold tracking-[0.2em] uppercase"
              >
                Partner Login
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background flex w-full items-center justify-between border-t border-white/10 px-8 py-6">
        <div className="flex items-center gap-6">
          <span className="font-headline text-foreground font-bold tracking-tighter">
            TourCRM
          </span>
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            © 2024 TourCRM. All rights reserved.
          </span>
        </div>
        <div className="flex gap-8">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-auto rounded-full px-0 text-[11px] font-semibold tracking-widest uppercase hover:bg-transparent"
          >
            Privacy
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-auto rounded-full px-0 text-[11px] font-semibold tracking-widest uppercase hover:bg-transparent"
          >
            Terms
          </Button>
        </div>
      </footer>
    </div>
  );
}
