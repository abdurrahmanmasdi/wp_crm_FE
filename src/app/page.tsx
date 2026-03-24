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
    <div className="group rounded-2xl border border-white/10 bg-[#181c22] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f0ff]/20 hover:shadow-[0_0_30px_rgba(0,240,255,0.08)]">
      <Icon className="mb-6 h-7 w-7 text-[#00f0ff] transition-transform duration-300 group-hover:scale-110" />
      <h3 className="mb-3 text-lg font-bold tracking-tight text-[#dfe2eb] uppercase">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-[#bacac5]">{description}</p>
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
    <div className="min-h-screen bg-[#0d1117] text-[#dfe2eb] antialiased">
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#181c22] px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-headline text-xl font-light tracking-tighter text-[#dfe2eb]">
            TourCRM
          </span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <span className="text-[11px] font-medium tracking-widest text-[#00f0ff] uppercase">
            Status: Private Beta
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="hidden h-auto rounded-xl px-4 py-2 text-[11px] tracking-widest text-[#bacac5] uppercase hover:bg-transparent hover:text-[#00f0ff] sm:block"
          >
            Partner Login
          </Button>
          <Button
            type="button"
            className="rounded-xl border border-[#3c4a46]/30 bg-transparent px-6 py-2 text-[11px] tracking-widest text-[#dfe2eb] uppercase transition-all hover:bg-[#31353c] active:scale-95"
          >
            Join Waitlist
          </Button>
        </div>
      </header>

      <main className="relative overflow-hidden pt-32 pb-24">
        <LandingBackdrop />

        <section className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-[#3c4a46]/20 bg-[#1c2026] px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#00f0ff]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#bacac5] uppercase">
              Now accepting beta requests
            </span>
          </div>

          <h1 className="mx-auto mb-8 max-w-4xl text-5xl leading-[0.95] font-bold tracking-[-0.04em] text-[#dfe2eb] md:text-7xl lg:text-8xl">
            The Future of Tourism Management
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[#bacac5] md:text-xl">
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
                  className="h-14 rounded-2xl border border-white/10 bg-[#181c22] px-6 text-[#dfe2eb] placeholder:text-[#bacac5]/40 focus-visible:ring-[#00f0ff]/40"
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
              <Link href="/login">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto cursor-pointer rounded-full px-0 text-[10px] font-bold tracking-widest text-[#bacac5]/60 uppercase hover:bg-transparent hover:text-[#00f0ff]"
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
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#262a31] p-12 text-center md:p-24">
            <div className="absolute inset-0 translate-y-32 -skew-y-12 bg-[#00f0ff]/5" />
            <h2 className="tight-tracking relative z-10 mb-8 text-3xl font-bold text-[#dfe2eb] md:text-5xl">
              Limited Beta Availability.
            </h2>
            <p className="relative z-10 mx-auto mb-12 max-w-xl text-[#bacac5]">
              We are currently onboarding a select group of agencies to our
              private testing phase. Secure your spot in the future of tour
              management.
            </p>
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                type="button"
                className="rounded-xl bg-[#00f0ff] px-12 py-4 text-xs font-bold tracking-[0.2em] text-black uppercase shadow-lg shadow-[#00f0ff]/10 transition-all hover:brightness-110 active:scale-95"
              >
                Join Waitlist
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl border border-[#3c4a46]/30 px-12 py-4 text-xs font-bold tracking-[0.2em] text-[#bacac5] uppercase hover:bg-[#00f0ff] hover:text-black"
              >
                Partner Login
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex w-full items-center justify-between border-t border-[#3c4a46]/20 bg-[#0a0e14] px-8 py-6">
        <div className="flex items-center gap-6">
          <span className="font-headline font-bold tracking-tighter text-[#dfe2eb]">
            TourCRM
          </span>
          <span className="text-[11px] font-semibold tracking-widest text-[#bacac5] uppercase">
            © 2024 TourCRM. All rights reserved.
          </span>
        </div>
        <div className="flex gap-8">
          <Button
            type="button"
            variant="ghost"
            className="h-auto rounded-full px-0 text-[11px] font-semibold tracking-widest text-[#bacac5] uppercase hover:bg-transparent hover:text-[#dfe2eb]"
          >
            Privacy
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-auto rounded-full px-0 text-[11px] font-semibold tracking-widest text-[#bacac5] uppercase hover:bg-transparent hover:text-[#dfe2eb]"
          >
            Terms
          </Button>
        </div>
      </footer>
    </div>
  );
}
