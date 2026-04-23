"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Hero Section */}
      <section className="flex flex-col gap-6 items-center justify-center text-center bg-surface p-8 border-4 border-outline-variant/20 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="space-y-4">
          <h1 className="font-accent text-4xl lg:text-6xl font-black text-on-surface tracking-tighter leading-none uppercase">
            QUEUE<span className="text-primary">BUDDY</span>
          </h1>
          <p className="font-pixel text-base text-on-surface-variant font-bold uppercase tracking-tight">
            Find players. Revive games. Play instantly.
          </p>
          <div className="text-[10px] font-pixel font-bold text-on-surface-variant border-x-4 border-primary px-3 bg-primary/5 py-1 uppercase tracking-widest inline-block">
            No login. No account. Just you and your squad.
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
      {/* Minecraft-Themed Welcome & Contribution Section */}
      <section className="bg-surface p-8 border-4 border-primary relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-8xl">handyman</span>
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-2 h-8 bg-primary animate-pulse" />
             <h2 className="font-accent text-3xl font-black text-on-surface uppercase tracking-tight">Welcome, Operative</h2>
          </div>
          
          <div className="bg-primary/5 p-6 voxel-border border-4 border-dashed border-primary/30 space-y-4">
             <p className="font-pixel text-sm font-bold text-on-surface leading-relaxed uppercase">
               QueueBuddy is a community-driven initiative built for the players, by the players. 
               We believe in zero-friction gaming and the preservation of multiplayer communities.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a 
                  href="https://github.com/RehanAslam2004" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mc-button mc-button-primary flex items-center justify-center gap-2 py-3 px-6"
                >
                  <span className="material-symbols-outlined text-base">fork_left</span>
                  CONTRIBUTE ON GITHUB
                </a>
                <div className="flex items-center gap-3 px-4 py-2 bg-surface border-2 border-on-surface/10">
                   <span className="material-symbols-outlined text-primary text-sm">contact_support</span>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Reporting bugs helps the network.</span>
                </div>
             </div>
          </div>
          
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] text-center opacity-40">
            Node Network Status: BETA-READY // AUTH: OPEN // ENCRYPTION: ACTIVE
          </p>
        </div>
      </section>
    </div>
  );
}
