"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { useRouter } from "next/navigation";
import { getGameIcon } from "@/lib/games";

type Server = {
  id: string;
  host_id: string;
  game: string;
  max_players: number;
  tags: string[];
  connect_info: string;
  status: string;
  created_at: string;
};

export default function ServerInvitePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { tempUserId, username } = useIdentity();
  const [server, setServer] = useState<Server | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sv } = await supabase
        .from("servers")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!sv) { setError("Server not found or no longer active."); setLoading(false); return; }
      setServer(sv);

      const { count } = await supabase
        .from("server_players")
        .select("*", { count: "exact", head: true })
        .eq("server_id", params.id);
      setPlayerCount(count ?? 0);

      // Check if already joined
      if (tempUserId) {
        const { data: me } = await supabase
          .from("server_players")
          .select("id")
          .eq("server_id", params.id)
          .eq("temp_user_id", tempUserId)
          .single();
        if (me) setJoined(true);
      }
      setLoading(false);
    };
    load();
  }, [params.id, tempUserId]);

  const handleJoin = async () => {
    if (!tempUserId || !username || !server) return;
    setJoining(true);
    await supabase.from("server_players").insert({
      server_id: server.id,
      temp_user_id: tempUserId,
      username,
    });
    setJoined(true);
    setJoining(false);
    // Redirect to lobbies after 1.5s
    setTimeout(() => router.push("/lobbies"), 1500);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-headline text-on-surface-variant animate-pulse text-xl uppercase tracking-widest">Loading...</div>
    </div>
  );

  if (error || !server) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-error-container border-4 border-error p-8 text-on-error-container font-headline font-bold text-center max-w-md">
        <span className="material-symbols-outlined text-4xl mb-4 block">error</span>
        <p className="text-xl">{error || "Server not found."}</p>
        <button onClick={() => router.push("/lobbies")} className="mt-6 bg-primary text-on-primary font-black py-3 px-6 uppercase tracking-widest text-sm">
          Browse Servers
        </button>
      </div>
    </div>
  );

  const isFull = playerCount >= server.max_players;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-container-high border-4 border-outline w-full max-w-sm shadow-[8px_8px_0_0_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-on-primary p-4 flex items-center gap-3">
          <div className="bg-on-primary/10 p-2 border-2 border-on-primary/20">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {getGameIcon(server.game)}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">You&apos;ve been invited to</p>
            <h1 className="font-headline text-xl font-black tracking-tight">{server.game}</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Tags */}
          {server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {server.tags.map((t) => (
                <span key={t} className="bg-surface-dim px-1.5 py-0 text-[8px] font-black uppercase border border-outline-variant/30">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-dim p-3 border-l-4 border-primary">
              <div className="font-headline font-black text-xl text-on-surface">{playerCount}</div>
              <div className="text-[9px] font-bold uppercase text-on-surface-variant tracking-widest">Players In</div>
            </div>
            <div className="bg-surface-dim p-3 border-l-4 border-secondary">
              <div className="font-headline font-black text-xl text-on-surface">{server.max_players}</div>
              <div className="text-[9px] font-bold uppercase text-on-surface-variant tracking-widest">Max Slots</div>
            </div>
          </div>

          {/* Fill bar */}
          <div className="space-y-1">
            <div className="h-2 bg-surface-variant border border-outline-variant/20">
              <div
                className="h-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(100, (playerCount / server.max_players) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] font-bold uppercase text-on-surface-variant tracking-wider">
              {isFull ? "⚠ Server is full" : `${server.max_players - playerCount} slots remaining`}
            </p>
          </div>

          {/* Join */}
          {joined ? (
            <div className="bg-primary/10 border-4 border-primary p-3 text-center">
              <span className="material-symbols-outlined text-primary text-2xl block mb-1">check_circle</span>
              <p className="font-headline font-black text-xs text-primary uppercase">Joined! Redirecting...</p>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isFull || joining}
              className="w-full bg-primary text-on-primary font-headline font-black py-3 border-b-4 border-on-primary-fixed-variant active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {isFull ? "🔒 Server Full" : joining ? "Joining..." : "Join Now 🎮"}
            </button>
          )}

          <p className="text-center text-[9px] font-body text-on-surface-variant">
            No account needed · Anonymous · Instant play
          </p>
        </div>
      </div>
    </div>
  );
}
