"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { GAMES, getGameIcon } from "@/lib/games";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── Types ────────────────────────────────────────────────── */
type Server = {
  id: string;
  host_id: string;
  game: string;
  max_players: number;
  tags: string[];
  connect_info: string;
  status: "active" | "full";
  created_at: string;
  players: ServerPlayer[];
};

type ServerPlayer = {
  id: string;
  server_id: string;
  temp_user_id: string;
  username: string;
};

type QuickMessage = { id: string; server_id: string; temp_user_id: string; username: string; text: string; created_at: string; };

/* ─── Game thumbnail map ───────────────────────────────────── */
const GAME_THUMBS: Record<string, string> = {
  "Minecraft":        "https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o",
  "Halo 3":           "https://lh3.googleusercontent.com/aida-public/AB6AXuAEkRfn_0_cp9PBmYYxBfFg_5LbcEPnttJQ9nzauqQe5PASutT8RA7mMZg1sioB3gU7i45GKfoGM50jRo8ScJbHo8Nv_yoKot5Gpvc7_I-iWfIzX3GLHTrXHyu7Fe7faQB1N5vPv5d5Ed8tLhkxB73FVOqAwIOrsd79jUfIL01TfLPhrlCWxGG_zoofahsHqEjO4ZrXK4fu9YPjJVhr0pMj73s8e-Fai33rR8il5yXG4AiHyrIkPUT8igu4SUCTEeH7jLoqpa9FWK2s",
  "Left 4 Dead 2":    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7r92x1DdMuCTjwVkhvneZxWZqh7IzxhUwjibGuna6McEVceTZpoykOWIwO3EL-cXomaNQuhMDriLUFivAo_eaQoP-4-DJl2gQE6ZjSc_FbfOgYwOq_ZiFiStesg9QbRC5X3XIKLpa-MF__qWJB2rXl64vm_fExq46ozSE56IfibSRDN7nGWss5sX_LZyl8usnxQIiitxEigS7jHXAcPBSjx7WvGCfS-IOM8iBlYEC0irFkXklbrZXavyMzaMiNdZkxP80d62w20rr",
  "Team Fortress 2":  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEnRJgLuZIaqX_-6-ARyLJTyzabi7bUrnHuzKrwrs3c_JIXpqe1v3NgPCuUtYy5eenQScUd1XdXWKvHYMRevmsMBodUeYV9fWZExI26UsAIStqI_geY8Ol6S5fbyLv4EJsAaa-KJy3Ut8IDUt7PEQ9QN_LWbcTti5F__Oaql93KHDjX-GRS6adJXkG2r4Oj10Zmw3i6ktDk7wCGZ8bcAiXzmAlYIqv1iqLgYDApy3ktyKJm9bVqey8go7gHOzTpo8kYhF6rNdY5qYK",
  "Garry's Mod":      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V3P0kswVVe4u96b6WyBDtvYv5b-HRLgPljTXSKTbVpr-Tr-D9fDcrHpjfs_F7kr_kY_MXAyy-PGH5Pmb2hLOeIGD0lxr0hwOW2DiOpjYXFIk-nxQ9Iu7R5OiZ2QZ5Hco9lkVOTK_-yrbovDpVcggy8AQhKnE1iY61POqAKErMhLLvkZfUFNyXTnRZrplS8qlbG05kJevrb5D1KeF-E2nRQv8tH8ciC4bKtn0j33zY4FlIpzM6BzXIQ1bFa107MF6_H0Nxu83Q74Z",
};
const getThumb = (game: string) =>
  GAME_THUMBS[game] ??
  `https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o`;

/* ─── Connect-info type detection ──────────────────────────── */
type ConnectType = "discord" | "ip" | "steam" | "link";
function detectConnectType(info: string): ConnectType {
  if (!info) return "link";
  if (info.includes("discord.gg") || info.includes("#") || info.match(/\w+#\d{4}/)) return "discord";
  if (info.includes("steam://") || info.toLowerCase().includes("steam")) return "steam";
  if (info.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) || (info.includes(".") && !info.includes(" "))) return "ip";
  return "link";
}
const CONNECT_META: Record<ConnectType, { label: string; icon: string; color: string; bg: string }> = {
  discord: { label: "Discord Server", icon: "chat_bubble", color: "text-[#5865F2]", bg: "bg-[#5865F2]/10 border-[#5865F2]/30" },
  ip:      { label: "Game Server IP", icon: "dns",         color: "text-primary",    bg: "bg-primary/10 border-primary/30"   },
  steam:   { label: "Steam Invite",   icon: "sports_esports", color: "text-[#1b2838]", bg: "bg-[#1b2838]/10 border-[#1b2838]/30" },
  link:    { label: "Invite Link",    icon: "link",         color: "text-tertiary",   bg: "bg-tertiary/10 border-tertiary/30" },
};

/* ─── Quick messages ────────────────────────────────────────── */
const QUICK_MSGS = ["Ready? 🎮", "Join fast! ⚡", "Add me 🙋", "Need 1 more! 📣", "GG! 🏆", "Wait for me 🏃"];

/* ─── Share url helper ─────────────────────────────────────── */
const getShareUrl = (id: string) =>
  typeof window !== "undefined" ? `${window.location.origin}/server/${id}` : `/server/${id}`;


/* ══════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════ */
export default function Lobbies() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-headline text-on-surface-variant italic">Loading Server Browser...</div>}>
      <LobbiesContent />
    </Suspense>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN CONTENT
══════════════════════════════════════════════════════════════ */
function LobbiesContent() {
  const { tempUserId, username, initialize } = useIdentity();
  const searchParams = useSearchParams();

  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGame, setNewGame] = useState("Minecraft");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [connectInfo, setConnectInfo] = useState("");
  const [tags, setTags] = useState("");

  // In-lobby slide-up drawer
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [quickMessages, setQuickMessages] = useState<QuickMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Data fetching ─────────────────────────────────────────── */
  const fetchServers = async () => {
    const { data: serverData } = await supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (serverData) {
      const { data: playerData } = await supabase.from("server_players").select("*");
      const mapped = serverData.map((s) => ({
        ...s,
        players: playerData?.filter((p) => p.server_id === s.id) || [],
      }));
      setServers(mapped as Server[]);

      // Update active server if open
      setActiveServer((prev) => {
        if (!prev) return null;
        return (mapped.find((s) => s.id === prev.id) as Server) ?? null;
      });
    }
    setLoading(false);
  };

  const fetchMessages = async (serverId: string) => {
    const { data } = await supabase
      .from("quick_messages")
      .select("*")
      .eq("server_id", serverId)
      .order("created_at", { ascending: true })
      .limit(40);
      
    if (data) {
      setQuickMessages(prev => {
        if (prev.length !== data.length) return data as QuickMessage[];
        if (prev.length > 0 && prev[prev.length - 1].id !== data[data.length - 1].id) {
          return data as QuickMessage[];
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    initialize();
    fetchServers();
    const ch = supabase
      .channel("server_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "servers" }, fetchServers)
      .on("postgres_changes", { event: "*", schema: "public", table: "server_players" }, fetchServers)
      .subscribe();

    if (searchParams.get("create") === "true") setShowCreateModal(true);

    return () => { supabase.removeChannel(ch); };
  }, [searchParams]);

  // Real-time quick messages for active server (with robust polling fallback)
  useEffect(() => {
    if (!activeServer) return;
    fetchMessages(activeServer.id);
    
    // Polling fallback: fetch every 2.5s in case realtime replication drops
    const pollInterval = setInterval(() => {
      fetchMessages(activeServer.id);
    }, 2500);

    const ch = supabase
      .channel(`msgs_${activeServer.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "quick_messages",
        filter: `server_id=eq.${activeServer.id}`,
      }, (payload) => {
        const newMsg = payload.new as QuickMessage;
        setQuickMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
      
    return () => { 
      clearInterval(pollInterval);
      supabase.removeChannel(ch); 
    };
  }, [activeServer?.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [quickMessages]);

  /* ── Body scroll lock when drawer or modal is open ───── */
  useEffect(() => {
    if (activeServer || showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [activeServer, showCreateModal]);

  /* ── Actions ────────────────────────────────────────────────── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId || !username || !connectInfo.trim()) return;
    setIsCreating(true);
    const { data: server } = await supabase
      .from("servers")
      .insert({
        host_id: tempUserId,
        game: newGame,
        max_players: maxPlayers,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        connect_info: connectInfo.trim(),
        status: "active",
      })
      .select()
      .single();

    if (server) {
      await supabase.from("server_players").insert({ server_id: server.id, temp_user_id: tempUserId, username });
      setShowCreateModal(false);
      setConnectInfo("");
      setTags("");
      showToast("Lobby created! 🎮");
    }
    setIsCreating(false);
  };

  const handleJoinServer = async (serverId: string) => {
    if (!tempUserId || !username) return;
    const server = servers.find((s) => s.id === serverId);
    if (!server || server.players.length >= server.max_players) return;
    if (server.players.some((p) => p.temp_user_id === tempUserId)) return;
    await supabase.from("server_players").insert({ server_id: serverId, temp_user_id: tempUserId, username });
    await fetchServers(); // Immediately refresh to reflect join
  };

  const handleLeaveServer = async (serverId: string) => {
    if (!tempUserId) return;
    
    // Optimistic Update: Remove self from local state immediately
    setServers(prev => prev.map(s => {
      if (s.id !== serverId) return s;
      return { ...s, players: s.players.filter(p => p.temp_user_id !== tempUserId) };
    }));

    // Close the drawer immediately if it's for this server
    if (activeServer?.id === serverId) setActiveServer(null);

    await supabase.from("server_players").delete().eq("server_id", serverId).eq("temp_user_id", tempUserId);
    
    const server = servers.find((s) => s.id === serverId);
    if (server && server.host_id === tempUserId) {
      const remaining = server.players.filter((p) => p.temp_user_id !== tempUserId);
      if (remaining.length > 0) {
        await supabase.from("servers").update({ host_id: remaining[0].temp_user_id }).eq("id", serverId);
      } else {
        await supabase.from("servers").delete().eq("id", serverId);
      }
    }
    fetchServers(); // Re-sync with server
  };

  const sendQuickMessage = async (text: string) => {
    if (!tempUserId || !username || !activeServer) return;
    
    const msgId = crypto.randomUUID();
    const optimisticMsg: QuickMessage = {
      id: msgId,
      server_id: activeServer.id,
      temp_user_id: tempUserId,
      username,
      text,
      created_at: new Date().toISOString()
    };
    
    setQuickMessages((prev) => [...prev, optimisticMsg]);
    setChatInput("");

    await supabase.from("quick_messages").insert({
      id: msgId,
      server_id: activeServer.id,
      temp_user_id: tempUserId,
      username,
      text,
    });
  };

  const handleSelectServer = async (server: Server) => {
    const isJoined = server.players.some((p) => p.temp_user_id === tempUserId);
    if (!isJoined && server.players.length < server.max_players) {
      await handleJoinServer(server.id);
    }
    setActiveServer(server);
  };

  const copyToClipboard = (text: string, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    showToast(label);
  };

  return (
    <>
      <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-headline font-black text-primary tracking-tighter">Server Browser</h1>
          <p className="text-xs text-on-surface-variant font-body">Connect with squads in active lobbies across the multiverse.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-on-primary font-headline font-black px-4 py-2 text-xs border-b-4 border-on-primary-fixed-variant active:translate-y-[2px] active:border-b-0 transition-all uppercase tracking-widest shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Create Server
        </button>
      </div>

      {/* ── Server Grid ─────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 border-l-4 border-secondary pl-2">
          <h2 className="font-headline text-base font-bold text-on-surface">Active Servers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-surface-container-low h-32 animate-pulse border-4 border-surface-variant"></div>
          ))
        ) : servers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-surface-container-low border-4 border-dashed border-surface-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 opacity-20">search_off</span>
            <p className="font-headline font-bold text-on-surface-variant">No active lobbies found matching your filters.</p>
          </div>
        ) : (
          servers.map((server) => {
            const isFull    = server.players.length >= server.max_players;
            const isJoined  = server.players.some((p) => p.temp_user_id === tempUserId);
            const isHost    = server.host_id === tempUserId;
            const isActive  = activeServer?.id === server.id;
            const ct        = detectConnectType(server.connect_info);
            const ctMeta    = CONNECT_META[ct];
            const fillPct   = Math.min(100, Math.round((server.players.length / server.max_players) * 100));

            return (
              <div
                key={server.id}
                className={`bg-surface-container-low border-2 transition-all duration-300 group flex flex-col hover:border-primary/50 relative ${
                  isActive ? "border-primary ring-1 ring-primary/20" : "border-outline-variant/10"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-16 overflow-hidden border-b border-outline-variant/10">
                  <img
                    src={getThumb(server.game)}
                    alt={server.game}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-20 mix-blend-multiply"
                    onError={(e) => { (e.target as HTMLImageElement).src = getThumb("Minecraft"); }}
                  />
                  
                  {/* Overlay Game Badge */}
                  <div className="absolute inset-0 p-2 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div className="bg-surface/80 backdrop-blur-sm text-on-surface font-headline font-black text-[7px] px-1.5 py-0.5 border border-outline-variant/20 flex items-center gap-1 uppercase tracking-tighter">
                        <span className="material-symbols-outlined text-[10px] text-primary">{getGameIcon(server.game)}</span>
                        {server.game}
                      </div>
                      
                      {isHost && (
                        <div className="bg-tertiary text-on-tertiary font-headline font-black text-[7px] px-1.5 py-0.5 uppercase tracking-tighter border border-tertiary-container shadow-sm">HOST</div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex -space-x-1.5">
                        {server.players.slice(0, 3).map((p) => (
                           <img 
                            key={p.id} 
                            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.username}`} 
                            className="w-4 h-4 border border-surface bg-surface-variant flex-shrink-0" 
                            alt={p.username} 
                          />
                        ))}
                      </div>
                      <span className={`text-[9px] font-black font-headline ${fillPct >= 90 ? 'text-error' : 'text-primary'} bg-surface/80 px-1 py-0.5 border border-outline-variant/10 tracking-widest`}>
                        {server.players.length}/{server.max_players}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-2 flex flex-col gap-2 bg-surface/30">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                       <h3 className="font-headline font-black text-[10px] text-on-surface uppercase tracking-tight truncate">
                        {server.game}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {server.tags?.map((tag, i) => (
                          <span key={i} className="text-[6px] font-black bg-primary/10 text-primary px-1 py-0.5 border border-primary/20 uppercase tracking-widest leading-none">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60 mt-1">
                        OP: {server.players.find((p) => p.temp_user_id === server.host_id)?.username || "ADMIN"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleSelectServer(server)}
                      className={`flex-1 font-headline font-black py-1 text-[9px] border-b-2 active:translate-y-[1px] active:border-b-0 transition-all uppercase tracking-widest ${
                        isActive 
                        ? "bg-tertiary text-on-tertiary border-on-tertiary-fixed-variant" 
                        : isJoined 
                          ? "bg-primary text-on-primary border-on-primary-fixed-variant" 
                          : "bg-surface-variant text-on-surface-variant border-outline-variant/30"
                      }`}
                    >
                      {isActive ? "VIEWING" : isJoined ? "OPEN" : "JOIN"}
                    </button>
                    
                    {isJoined && (
                      <button 
                        onClick={() => handleLeaveServer(server.id)}
                        className="bg-error/5 text-error px-1.5 py-1 hover:bg-error hover:text-on-error transition-all border border-error/20 flex items-center justify-center shrink-0"
                        title="Leave Lobby"
                      >
                        <span className="material-symbols-outlined text-[14px]">logout</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        </div>
      </section>

      {/* ── Lobby Detail Drawer (Global Overlay) ────────────────── */}
      {activeServer && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          onClick={() => setActiveServer(null)}
        >
          {/* Backdrop blur - only on the background */}
          <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-md pointer-events-auto" />
          
          <div 
            className="w-full max-w-[1200px] bg-surface-container-highest border-t-8 border-x-8 border-primary shadow-[0_-16px_32px_rgba(0,0,0,0.3)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-3 border-b-2 border-outline-variant/10 bg-surface-container-high">
              <div className="flex items-center gap-3">
                <img 
                  src={getThumb(activeServer.game)} 
                  alt={activeServer.game} 
                  className="w-12 h-9 object-cover border-2 border-primary" 
                />
                <div>
                  <h2 className="font-headline text-lg font-black text-on-surface uppercase tracking-tight leading-none mb-1">
                    {activeServer.game} Lobby
                  </h2>
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                    Connected via {activeServer.connect_info.includes('discord') ? 'Discord' : 'Server IP'}
                  </p>
                </div>

              </div>
              <div className="flex items-center gap-3">
                 <button
                    onClick={() => handleLeaveServer(activeServer.id)}
                    className="bg-error text-on-error font-headline font-black px-6 py-3 text-xs border-b-4 border-on-error-fixed shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-[2px] active:border-b-0 transition-all uppercase tracking-widest flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Exit Lobby
                  </button>
                <button 
                  onClick={() => setActiveServer(null)}
                  className="bg-surface-dim text-on-surface-variant hover:text-on-surface p-3 border-b-4 border-outline-variant active:translate-y-1 active:border-b-0 transition-all"
                >
                  <span className="material-symbols-outlined text-3xl">expand_more</span>
                </button>
              </div>
            </div>

            {/* Panel Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <InLobbyPanel
                server={activeServer}
                messages={quickMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSend={sendQuickMessage}
                onCopyConnect={(info) => copyToClipboard(info, "Connect info copied!")}
                currentUserId={tempUserId || ""}
                chatEndRef={chatEndRef}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-on-surface text-surface px-6 py-3 font-headline font-black border-4 border-surface shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] animate-slide-up flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          {toast.toUpperCase()}
        </div>
      )}

      {/* ── Create Server Modal ───────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-sm">
          <div className="bg-surface-container-highest border-4 border-outline shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-headline text-xl font-black text-on-surface tracking-tighter uppercase">Host Lobby</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black font-headline uppercase tracking-widest text-on-surface-variant">Target Game</label>
                <select
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  className="w-full bg-surface-dim border-none p-3 font-headline font-bold text-sm text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                >
                  {Object.entries(GAMES).map(([cat, games]) => (
                    <optgroup key={cat} label={cat}>
                      {games.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
                    </optgroup>
                  ))}
                  <option value="Custom / Other">Custom / Other</option>
                </select>
                <div className="flex items-center gap-2 p-1.5 bg-surface-dim border border-outline-variant/20">
                  <img src={getThumb(newGame)} alt={newGame} className="w-10 h-7 object-cover" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">{newGame}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black font-headline uppercase tracking-widest text-on-surface-variant">Slots</label>
                  <input
                    type="number" min="1" max="100"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full bg-surface-dim border-none p-3 font-headline font-bold text-sm text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black font-headline uppercase tracking-widest text-on-surface-variant">Tags (csv)</label>
                  <input
                    type="text" placeholder="Chill, Mic ON..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-surface-dim border-none p-3 font-headline text-sm text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black font-headline uppercase tracking-widest text-on-surface-variant">Connect Info</label>
                <input
                  required type="text"
                  placeholder="Discord: user#1234  or  IP: play.server.com"
                  value={connectInfo}
                  onChange={(e) => setConnectInfo(e.target.value)}
                  className="w-full bg-surface-dim border-none p-3 font-headline text-sm text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                />
                {connectInfo && (() => {
                  const ct = detectConnectType(connectInfo);
                  const m  = CONNECT_META[ct];
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border ${m.bg} ${m.color}`}>
                      <span className="material-symbols-outlined text-sm">{m.icon}</span>
                      Detected: {m.label}
                    </div>
                  );
                })()}
              </div>

              <button
                type="submit" disabled={isCreating}
                className="w-full bg-primary text-on-primary font-headline font-black py-3 border-b-4 border-on-primary-fixed-variant active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest text-sm disabled:opacity-60"
              >
                {isCreating ? "BOOTING..." : "INITIATE SERVER"}
              </button>
            </form>
          </div>
        </div>
      )}
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   IN-LOBBY SLIDE-UP PANEL
══════════════════════════════════════════════════════════════ */
function InLobbyPanel({
  server,
  messages,
  chatInput,
  setChatInput,
  onSend,
  onCopyConnect,
  currentUserId,
  chatEndRef,
}: {
  server: Server;
  messages: QuickMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: (text: string) => void;
  onCopyConnect: (info: string) => void;
  currentUserId: string;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ct     = detectConnectType(server.connect_info);
  const ctMeta = CONNECT_META[ct];

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 flex-1 overflow-auto bg-surface-container-low/50">
      {/* LEFT: Lobby Controls & Details */}
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface/40 p-3 border border-outline-variant/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">map</span>
              <div>
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Session Host</p>
                <p className="text-xs font-black text-on-surface uppercase tracking-tight">
                  {server.players.find(p => p.temp_user_id === server.host_id)?.username || 'Host Unassigned'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onCopyConnect(getShareUrl(server.id))}
              className="p-2 hover:bg-on-surface/5 transition-colors rounded-full flex items-center justify-center group"
              title="Copy Share Link"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">share</span>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onCopyConnect(server.connect_info)}
              className="w-full bg-on-surface text-surface font-headline font-black py-4 text-lg border-b-6 border-surface-variant active:translate-y-[4px] active:border-b-0 transition-all flex flex-col items-center justify-center gap-1.5 uppercase tracking-wide group shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform duration-300">
                  {ct === 'steam' ? 'sports_esports' : ct === 'discord' ? 'forum' : 'lan'}
                </span>
                <span>{ct === 'ip' ? 'LAUNCH SERVER / COPY IP' : `CONNECT VIA ${ct.toUpperCase()}`}</span>
              </div>
            </button>
            
            <div className="bg-surface/30 p-4 border border-outline-variant/10 backdrop-blur-sm font-mono text-center">
              <p className="text-sm text-on-surface break-all leading-relaxed bg-surface/20 py-2">
                {server.connect_info}
              </p>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-60">Lobby Roster</p>
            <span className="bg-primary px-2 py-0.5 text-[8px] font-black text-on-primary">
              {server.players.length} / {server.max_players} PLAYERS
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {server.players.map((p) => (
              <div key={p.id} className={`flex items-center gap-2.5 p-1.5 border ${p.temp_user_id === currentUserId ? 'bg-primary/10 border-primary shadow-sm' : 'bg-surface-dim border-outline-variant/10'}`}>
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.username}`}
                  alt={p.username}
                  className="w-6 h-6 border border-outline-variant/20 bg-surface shadow-sm"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-headline font-black text-[10px] text-on-surface truncate">
                    {p.username}
                  </span>
                  {p.temp_user_id === server.host_id && (
                    <span className="text-[6px] font-black text-tertiary uppercase tracking-widest flex items-center gap-0.5">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* RIGHT: Quick Messages */}
      <div className="w-full lg:w-[280px] flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-60">Operations Comms</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-primary">LIVE</span>
          </div>
        </div>

        <div className="flex-1 bg-surface-dim border-2 border-outline-variant/20 flex flex-col shadow-sm">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                <p className="text-[8px] font-black uppercase tracking-widest mt-1">Standby for comms...</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-1.5 items-start ${m.temp_user_id === currentUserId ? "flex-row-reverse" : ""}`}>
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.username}`}
                  alt=""
                  className="w-5 h-5 border border-outline-variant/20 flex-shrink-0"
                />
                <div className={`max-w-[85%] px-2 py-1 border ${m.temp_user_id === currentUserId ? "bg-primary text-on-primary border-primary/20 shadow-sm" : "bg-surface-container-high text-on-surface border-outline-variant/10 shadow-sm"}`}>
                  <span className="font-black block text-[7px] opacity-70 uppercase truncate">{m.username}</span>
                  <p className="text-[11px] font-medium leading-tight">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 border-t border-outline-variant/10 bg-surface/50 space-y-2">
            {/* Preset quick messages */}
            <div className="flex flex-wrap gap-1">
              {QUICK_MSGS.slice(0, 4).map((msg) => (
                <button
                  key={msg}
                  onClick={() => onSend(msg)}
                  className="bg-surface border border-outline-variant/30 text-on-surface font-headline font-black text-[8px] uppercase px-2 py-1 hover:bg-primary hover:text-on-primary transition-all"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Free text input */}
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Comms..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && chatInput.trim() && onSend(chatInput.trim())}
                className="flex-1 bg-surface-dim border border-outline-variant/30 px-2 py-1.5 font-body text-[11px] text-on-surface outline-none focus:border-primary/50"
              />
              <button
                onClick={() => chatInput.trim() && onSend(chatInput.trim())}
                className="bg-primary text-on-primary px-3 font-headline font-black text-[10px] border-b-2 border-on-primary-fixed-variant active:translate-y-[1px] active:border-b-0 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
