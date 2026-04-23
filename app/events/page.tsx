"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { checkAndConvertExpiredItems } from "@/lib/utils/conversion";
import { getGameIcon } from "@/lib/games";
import { PixelAvatar } from "@/components/PixelAvatar";
import { useSound } from "@/hooks/useSound";
import { incrementPlayerStat } from "@/lib/rewards";

type AppEvent = {
  id: string;
  game: string;
  title: string;
  total_slots: number;
  joined_count: number;
  event_time: string;
  is_featured?: boolean;
  description?: string;
};

/* ─── Game thumbnail map ──────────────────────────────────── */
const GAME_THUMBS: Record<string, string> = {
  "Minecraft":        "https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o",
  "Halo 3":           "https://lh3.googleusercontent.com/aida-public/AB6AXuAEkRfn_0_cp9PBmYYxBfFg_5LbcEPnttJQ9nzauqQe5PASutT8RA7mMZg1sioB3gU7i45GKfoGM50jRo8ScJbHo8Nv_yoKot5Gpvc7_I-iWfIzX3GLHTrXHyu7Fe7faQB1N5vPv5d5Ed8tLhkxB73FVOqAwIOrsd79jUfIL01TfLPhrlCWxGG_zoofahsHqEjO4ZrXK4fu9YPjJVhr0pMj73s8e-Fai33rR8il5yXG4AiHyrIkPUT8igu4SUCTEeH7jLoqpa9FWK2s",
  "Left 4 Dead 2":    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7r92x1DdMuCTjwVkhvneZxWZqh7IzxhUwjibGuna6McEVceTZpoykOWIwO3EL-cXomaNQuhMDriLUFivAo_eaQoP-4-DJl2gQE6ZjSc_FbfOgYwOq_ZiFiStesg9QbRC5X3XIKLpa-MF__qWJB2rXl64vm_fExq46ozSE56IfibSRDN7nGWss5sX_LZyl8usnxQIiitxEigS7jHXAcPBSjx7WvGCfS-IOM8iBlYEC0irFkXklbrZXavyMzaMiNdZkxP80d62w20rr",
  "Team Fortress 2":  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEnRJgLuZIaqX_-6-ARyLJTyzabi7bUrnHuzKrwrs3c_JIXpqe1v3NgPCuUtYy5eenQScUd1XdXWKvHYMRevmsMBodUeYV9fWZExI26UsAIStqI_geY8Ol6S5fbyLv4EJsAaa-KJy3Ut8IDUt7PEQ9QN_LWbcTti5F__Oaql93KHDjX-GRS6adJXkG2r4Oj10Zmw3i6ktDk7wCGZ8bcAiXzmAlYIqv1iqLgYDApy3ktyKJm9bVqey8go7gHOzTpo8kYhF6rNdY5qYK",
  "Garry's Mod":      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V3P0kswVVe4u96b6WyBDtvYv5b-HRLgPljTXSKTbVpr-Tr-D9fDcrHpjfs_F7kr_kY_MXAyy-PGH5Pmb2hLOeIGD0lxr0hwOW2DiOpjYXFIk-nxQ9Iu7R5OiZ2QZ5Hco9lkVOTK_-yrbovDpVcggy8AQhKnE1iY61POqAKErMhLLvkZfUFNyXTnRZrplS8qlbG05kJevrb5D1KeF-E2nRQv8tH8ciC4bKtn0j33zY4FlIpzM6BzXIQ1bFa107MF6_H0Nxu83Q74Z",
};
const getThumb = (game: string) =>
  GAME_THUMBS[game] ?? GAME_THUMBS["Minecraft"];

/* ─── Animated number ──────────────────────────────────────── */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash]     = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const diff  = value - prev.current;
    const steps = Math.min(Math.abs(diff), 30);
    const step  = diff / steps;
    let current = prev.current;
    let i = 0;
    setFlash(true);
    const id = setInterval(() => {
      i++;
      current += step;
      setDisplay(Math.round(current));
      if (i >= steps) {
        clearInterval(id);
        setDisplay(value);
        setFlash(false);
        prev.current = value;
      }
    }, 30);
    return () => clearInterval(id);
  }, [value]);

  return (
    <span className={`${className} transition-all ${flash ? "animate-count-flash" : ""}`}>
      {display.toLocaleString()}
    </span>
  );
}

/* ─── Countdown timer ─────────────────────────────────────── */
function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => setRemaining(Math.max(0, new Date(target).getTime() - Date.now()));
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  const d  = Math.floor(remaining / 86_400_000);
  const h  = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m  = Math.floor((remaining % 3_600_000)  /    60_000);
  const s  = Math.floor((remaining %    60_000)  /     1_000);
  const over = remaining === 0;

  if (over) return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-headline font-black text-2xl text-error animate-pulse">LIVE NOW</span>
    </div>
  );

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex gap-3 items-end">
      {d > 0 && <Digit n={d} label="days" />}
      <Digit n={h} label="hrs" />
      <span className="font-headline font-black text-3xl text-on-surface-variant pb-4">:</span>
      <Digit n={m} label="min" />
      <span className="font-headline font-black text-3xl text-on-surface-variant pb-4">:</span>
      <Digit n={s} label="sec" />
    </div>
  );
}
function Digit({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-headline font-black text-4xl text-tertiary tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ─── Revival status label ─────────────────────────────────── */
function RevivalStatus({ pct }: { pct: number }) {
  if (pct >= 100) return (
    <div className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 font-headline font-black text-sm uppercase tracking-widest animate-pulse">
      <span className="material-symbols-outlined text-sm">celebration</span> REVIVED! 🎉
    </div>
  );
  if (pct >= 80) return (
    <div className="inline-flex items-center gap-2 bg-tertiary text-on-tertiary px-3 py-1 font-headline font-black text-xs uppercase tracking-widest animate-fire">
      🔥 Almost Revived! {pct}% there!
    </div>
  );
  if (pct >= 50) return (
    <div className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-3 py-1 font-headline font-black text-xs uppercase tracking-widest">
      ⚡ Gaining Momentum! {pct}% filled
    </div>
  );
  return (
    <div className="inline-flex items-center gap-2 bg-surface-container border-2 border-outline-variant/30 px-3 py-1 font-headline font-black text-xs uppercase tracking-widest text-on-surface">
      🌱 Revival Started · {pct}% filled
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function EventsPage() {
  const { tempUserId } = useIdentity();
  const { play } = useSound();
  const [events, setEvents]             = useState<AppEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activeJoinFlash, setActiveJoinFlash] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("event_time", { ascending: true });
      if (data) setEvents(data as AppEvent[]);
    };

    const fetchActivity = async () => {
      const { data } = await supabase
        .from("server_players")
        .select("*, servers(game)")
        .order("joined_at", { ascending: false })
        .limit(8);
      if (data) setRecentActivity(data);
    };

    fetchEvents();
    fetchActivity();

    const stored = localStorage.getItem("qb_joined_events");
    if (stored) setJoinedEvents(JSON.parse(stored));

    const evCh = supabase
      .channel("events_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchEvents)
      .subscribe();

    const actCh = supabase
      .channel("activity_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "server_players" },
        (payload) => {
          setRecentActivity((prev) => [payload.new, ...prev].slice(0, 8));
        })
      .subscribe();

    const interval = setInterval(checkAndConvertExpiredItems, 10_000);

    return () => {
      supabase.removeChannel(evCh);
      supabase.removeChannel(actCh);
      clearInterval(interval);
    };
  }, []);

  const handleJoinEvent = async (event: AppEvent) => {
    if (!tempUserId || joinedEvents.includes(event.id)) return;
    play("click");
    const { error } = await supabase
      .from("events")
      .update({ joined_count: event.joined_count + 1 })
      .eq("id", event.id);
    if (!error) {
      const updated = [...joinedEvents, event.id];
      setJoinedEvents(updated);
      localStorage.setItem("qb_joined_events", JSON.stringify(updated));
      // Trigger flash animation on counter
      setActiveJoinFlash(event.id);
      setTimeout(() => setActiveJoinFlash(null), 800);
      play("xp");
      // Tracking
      incrementPlayerStat(tempUserId, "events_joined");
    } else {
      play("error");
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant animate-float">public_off</span>
        <p className="font-headline text-2xl font-bold text-on-surface-variant">No events yet.</p>
        <p className="text-sm font-body text-on-surface-variant">Admins can create events from the Settings → Operations Command panel.</p>
      </div>
    );
  }

  const featured = events.find((e) => e.is_featured) ?? events[0];
  const upcoming = events.filter((e) => e.id !== featured.id);
  const featuredPct = Math.min(100, Math.round((featured.joined_count / featured.total_slots) * 100));

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────── */}
      <header className="mb-4">
        <h1 className="text-2xl font-headline font-black text-primary tracking-tighter">Revive World</h1>
        <p className="text-xs text-on-surface-variant font-body mt-0.5">Bring dead multiplayer worlds back to life.</p>
      </header>

      {/* ── Featured Event Hero ──────────────────────────────── */}
      <section className="relative overflow-hidden border-4 voxel-border border-outline mb-6 group scanlines shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
        {/* Voxel Grid Overlay */}
        <div className="absolute inset-0 z-0 opacity-10 voxel-grid group-hover:opacity-15 transition-opacity" />

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={getThumb(featured.game)}
            alt="background"
            className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-all duration-1000 scale-110 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-surface/95 via-surface/80 to-primary-container/10" />
        </div>

        <div className="relative z-10 p-4 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left info */}
          <div className="xl:col-span-2 space-y-6">
            {/* Featured badge + status */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-tertiary text-on-tertiary px-3 py-1.5 font-headline font-black text-xs uppercase tracking-widest border-b-4 border-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                Featured Revival
              </div>
              <RevivalStatus pct={featuredPct} />
            </div>

            {/* Game + title */}
            <div className="flex gap-3 items-center">
              <div className="bg-surface p-2 border-4 voxel-border border-outline-variant/30 flex-shrink-0 animate-float">
                <span
                  className="material-symbols-outlined text-3xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {getGameIcon(featured.game)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-headline font-black text-on-surface tracking-tighter">
                  Revive {featured.game}
                </h2>
                <p className="text-xs font-body font-bold text-tertiary">{featured.title}</p>
              </div>
            </div>

            {/* Stats + Progress */}
            <div className="bg-surface border-4 voxel-border border-outline-variant/20 p-3 max-w-sm space-y-3 shadow-[4px_4px_0_0_rgba(233,232,233,1)]">
              {/* Live counter */}
              <div className="flex justify-between items-end">
                <div>
                  <AnimatedNumber
                    value={featured.joined_count}
                    className="font-headline font-black text-2xl text-primary block"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Players Joined
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline font-black text-lg text-on-surface block">
                    {featured.total_slots.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Goal</span>
                </div>
              </div>

                <div className="h-5 bg-surface-container-highest border-2 border-outline-variant/20 relative overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 shadow-[inset_-2px_0_0_rgba(0,0,0,0.1)] ${
                      featuredPct >= 80 ? "animate-progress bg-tertiary" :
                      featuredPct >= 50 ? "bg-secondary" : "bg-primary"
                    }`}
                    style={{ width: `${Math.max(4, featuredPct)}%` }}
                  >
                    {/* Minecraft chunky progress stripes */}
                    <div className="absolute inset-0 flex gap-1 overflow-hidden opacity-20">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-2 h-full bg-white skew-x-12 flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                  {/* Percentage text: ensuring it's always visible with high contrast */}
                  <span className="absolute inset-0 flex items-center justify-center font-headline font-black text-[10px] text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">
                    {featuredPct}% CAPACITY REACHED
                  </span>
                </div>

                {featuredPct >= 80 && featuredPct < 100 && (
                  <p className="text-xs font-black text-tertiary animate-fire uppercase tracking-widest">
                    🔥 Almost there! Just {featured.total_slots - featured.joined_count} more needed!
                  </p>
                )}
                {featuredPct >= 100 && (
                  <p className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">
                    🎉 Revival Goal Reached! The world lives again!
                  </p>
                )}
              </div>

              {/* Join Button */}
              {!joinedEvents.includes(featured.id) ? (
                <button
                  onClick={() => handleJoinEvent(featured)}
                  className="w-full bg-primary text-on-primary font-headline font-black text-base py-3 border-b-4 border-on-primary-fixed-variant active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
                  Join Revival
                </button>
              ) : (
                <div className="w-full bg-surface-variant border-4 border-outline-variant text-on-surface-variant font-headline font-black text-sm py-3 flex items-center justify-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  You're In! 🎉
                </div>
              )}
            </div>

          {/* Countdown panel */}
          <div className="bg-surface border-4 voxel-border border-outline-variant/20 p-5 flex flex-col items-center shadow-[4px_4px_0_0_rgba(233,232,233,1)] gap-3">
            <p className="font-headline text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Event Starts In
            </p>
            <Countdown target={featured.event_time} />
            <div className="w-full border-t-2 border-outline-variant/20 pt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-on-surface-variant uppercase tracking-wider">Date</span>
                <span className="font-headline text-on-surface">{new Date(featured.event_time).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-on-surface-variant uppercase tracking-wider">Time</span>
                <span className="font-headline text-on-surface">{new Date(featured.event_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid: Upcoming + Pulse ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {/* Upcoming */}
        <section className="xl:col-span-3">
          <h3 className="font-headline text-lg font-bold text-on-surface mb-6 border-l-4 border-tertiary pl-3">
            Upcoming Revivals
          </h3>
          {upcoming.length === 0 && (
            <p className="text-on-surface-variant font-body italic text-xs">No other events scheduled yet.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {upcoming.map((event) => {
              const pct = Math.min(100, Math.round((event.joined_count / event.total_slots) * 100));

              const hasJoined = joinedEvents.includes(event.id);
              return (
                <div
                  key={event.id}
                  className="bg-surface-container-low border-4 voxel-border border-outline-variant/20 hover:-translate-y-2 hover:shadow-[8px_8px_0_0_rgba(191,202,181,0.5)] transition-all duration-200 flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="h-24 relative overflow-hidden border-b-2 border-outline-variant/10">
                    <img
                      src={getThumb(event.game)}
                      alt={event.game}
                      className="w-full h-full object-cover opacity-80"
                      onError={(e) => { (e.target as HTMLImageElement).src = getThumb("Minecraft"); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/50 via-transparent to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-headline text-[13px] font-black text-on-surface uppercase leading-tight">{event.title}</h4>
                        <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest mt-0.5">
                          {new Date(event.event_time).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="bg-surface-variant/50 p-1 border border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm text-primary">{getGameIcon(event.game)}</span>
                      </div>
                    </div>

                    {/* Mini progress */}
                    <div className="space-y-1 bg-surface-dim/30 p-2 border border-outline-variant/10">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
                        <span>{event.joined_count} / {event.total_slots} SLOTS</span>
                        <span className="text-primary">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-container border border-outline-variant/20">
                        <div
                          className={`h-full transition-all duration-700 ${pct >= 80 ? 'bg-tertiary' : 'bg-primary'}`}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto">
                      {!hasJoined ? (
                        <button
                          onClick={() => handleJoinEvent(event)}
                          className="mc-button w-full bg-primary text-on-primary font-headline font-black py-2.5 shadow-sm text-[10px] uppercase tracking-widest border-b-2 border-on-primary-fixed-variant"
                        >
                          JOIN OPS
                        </button>
                      ) : (
                        <div className="w-full bg-surface-variant/50 text-on-surface-variant font-headline font-black py-2 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 border border-outline-variant/20">
                          <span className="material-symbols-outlined text-primary text-[12px]">check_circle</span>
                          COMMITTED
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              );
            })}
          </div>
        </section>

        {/* Pulse feed */}
        <aside className="space-y-3">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
            Pulse
          </h3>
          <div className="bg-surface-container border-4 voxel-border border-outline-variant/20 overflow-hidden">
            <div className="bg-primary/10 border-b-2 border-outline-variant/20 p-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Live Activity</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="text-[8px] font-black text-primary uppercase">Live</span>
              </span>
            </div>
            <div className="divide-y-2 divide-outline-variant/10 max-h-[480px] overflow-y-auto">
              {recentActivity.map((act, i) => (
                <div
                  key={i}
                  className={`p-4 flex gap-3 items-start hover:bg-surface-variant/10 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}
                >
                  <div className={`flex-shrink-0 ${i === 0 ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                    <PixelAvatar size="sm" username={act.username} mcUsername={act.mc_username} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-black text-primary text-xs truncate">{act.username}</span>
                      <span className="text-[9px] text-on-surface-variant uppercase">joined</span>
                    </div>
                    <div className="text-[10px] font-black text-on-surface uppercase tracking-tight flex items-center gap-1 mt-0.5 truncate">
                      <span className="material-symbols-outlined text-xs">{getGameIcon(act.servers?.game || "Minecraft")}</span>
                      {act.servers?.game || "Unknown"} Lobby
                    </div>
                    {i === 0 && (
                      <div className="text-[8px] text-primary font-black uppercase tracking-widest mt-0.5 animate-pulse">
                        ● just now
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="p-10 text-center text-xs text-on-surface-variant italic font-body">
                  <span className="material-symbols-outlined block text-2xl mb-2 animate-pulse">sensors</span>
                  Waiting for activity...
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
