"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-6 items-center justify-between bg-surface p-6 border-4 border-outline-variant/20 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="flex-1 space-y-3">
          <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tighter leading-none">
            Queue<span className="text-primary">Buddy</span>
          </h1>
          <p className="font-body text-base text-on-surface-variant font-medium">
            Find players. Revive games. Play instantly.
          </p>
          <p className="text-xs font-body text-on-surface-variant border-l-4 border-primary pl-3">
            No login. No account. Just you and your squad.
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-secondary-container border-4 border-secondary flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <span
              className="material-symbols-outlined text-6xl text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              videogame_asset
            </span>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/lobbies"
          className="group flex flex-col items-center justify-center gap-3 bg-primary text-on-primary p-6 border-b-4 border-on-primary-fixed-variant active:border-b-0 active:translate-y-1 transition-all hover:brightness-110"
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          <span className="font-headline text-lg font-bold">Join Lobby</span>
          <span className="text-xs opacity-75 font-body text-center">Browse live servers and hop in instantly</span>
        </Link>

        <Link
          href="/raids"
          className="group flex flex-col items-center justify-center gap-3 bg-secondary text-on-secondary p-6 border-b-4 border-on-secondary-fixed-variant active:border-b-0 active:translate-y-1 transition-all hover:brightness-110"
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
          <span className="font-headline text-lg font-bold">Plan Raid</span>
          <span className="text-xs opacity-75 font-body text-center">Schedule sessions and recruit your crew</span>
        </Link>

        <Link
          href="/events"
          className="group flex flex-col items-center justify-center gap-3 bg-tertiary text-on-tertiary p-6 border-b-4 border-on-tertiary-fixed-variant active:border-b-0 active:translate-y-1 transition-all hover:brightness-110"
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
          <span className="font-headline text-lg font-bold">Revive World</span>
          <span className="text-xs opacity-75 font-body text-center">Join community events for dying games</span>
        </Link>
      </section>

      {/* How It Works */}
      <section className="bg-surface-container-highest p-6 border-4 border-outline-variant/20 flex flex-col gap-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', icon: 'person', title: 'Auto Identity', desc: 'A Minecraft-style username is auto-generated for you. No signup required.' },
            { step: '02', icon: 'dns', title: 'Browse or Host', desc: 'Find an active server to join, or create your own lobby in seconds.' },
            { step: '03', icon: 'link', title: 'Connect & Play', desc: 'Copy the server info and connect directly in your game. That simple.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-on-primary flex items-center justify-center font-headline font-black text-sm border-b-4 border-on-primary-fixed-variant">
                {step}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                  <h3 className="font-headline font-bold text-sm text-on-surface">{title}</h3>
                </div>
                <p className="text-xs text-on-surface-variant font-body">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
