"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { GAMES, getGameIcon } from "@/lib/games";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PixelAvatar } from "@/components/PixelAvatar";
import { ROLES, RoleType } from "@/app/raids/page";
import { getMinecraftStatus } from "@/lib/mc-status";
import { useSound } from "@/hooks/useSound";
import { incrementPlayerStat } from "@/lib/rewards";

type ServerPlayer = {
  id: string;
  server_id: string;
  temp_user_id: string;
  username: string;
  mc_username?: string;
  role?: string;
};

type Server = {
  id: string;
  host_id: string;
  game: string;
  max_players: number;
  connect_info: string;
  tags?: string[];
  status: string;
  origin_id?: string;
  created_at: string;
  players: ServerPlayer[];
};

type QuickMessage = { 
  id: string; 
  server_id: string; 
  temp_user_id: string; 
  username: string; 
  mc_username?: string;
  text: string; 
  created_at: string; 
};

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
  const { tempUserId, username, mcUsername, initialize } = useIdentity();
  const searchParams = useSearchParams();

  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const { play } = useSound();
  const [mcStatus, setMcStatus] = useState<Record<string, any>>({});

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGame, setNewGame] = useState("Minecraft");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [connectInfo, setConnectInfo] = useState("");
  const [tags, setTags] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType>("dps");

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

  // Ping Minecraft servers on load
  useEffect(() => {
    servers.forEach(s => {
      if (s.game.toLowerCase() === "minecraft" && detectConnectType(s.connect_info) === "ip" && mcStatus[s.id] === undefined) {
        // mark as pending to avoid duplicate calls
        setMcStatus(prev => ({...prev, [s.id]: { pending: true }}));
        getMinecraftStatus(s.connect_info).then(data => {
          setMcStatus(prev => ({...prev, [s.id]: data}));
        });
      }
    });
  }, [servers]);

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
    play("click");
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
      await supabase.from("server_players").insert({ 
        server_id: server.id, 
        temp_user_id: tempUserId, 
        username,
        mc_username: mcUsername || null,
        role: selectedRole
      });
      setShowCreateModal(false);
      setConnectInfo("");
      setTags("");
      showToast("Lobby created! 🎮");
      play("xp");
    } else {
      play("error");
    }
    setIsCreating(false);
  };

  const handleJoinServer = async (serverId: string, role: RoleType = "dps") => {
    if (!tempUserId || !username) return;
    const server = servers.find((s) => s.id === serverId);
    if (!server || server.players.length >= server.max_players) return;
    if (server.players.some((p) => p.temp_user_id === tempUserId)) {
      setActiveServer(server);
      return;
    }
    await supabase.from("server_players").insert({ 
      server_id: serverId, 
      temp_user_id: tempUserId, 
      username,
      mc_username: mcUsername || null,
      role: role
    });
    showToast(`Joined as ${role}!`);
    play("xp");
    await fetchServers();
  };

  const handleLeaveServer = async (serverId: string) => {
    play("click");
    if (!tempUserId) return;
    
    // Close the drawer immediately if it's for this server
    if (activeServer?.id === serverId) setActiveServer(null);

    // 1. Delete the player record
    await supabase.from("server_players").delete().eq("server_id", serverId).eq("temp_user_id", tempUserId);
    
    // 2. Fetch fresh server data to check remaining players
    const { data: updatedPlayers } = await supabase
      .from("server_players")
      .select("*")
      .eq("server_id", serverId);

    const remainingCount = updatedPlayers?.length || 0;

    if (remainingCount === 0) {
      // LAST PLAYER LEFT: Delete the server and all its messages
      await supabase.from("quick_messages").delete().eq("server_id", serverId);
      await supabase.from("servers").delete().eq("id", serverId);
    } else {
      // Server still has people, check if we need to hand over host
      const server = servers.find((s) => s.id === serverId);
      if (server && server.host_id === tempUserId) {
        await supabase.from("servers").update({ host_id: updatedPlayers![0].temp_user_id }).eq("id", serverId);
      }
    }
    
    fetchServers(); // Re-sync list
  };

  const sendQuickMessage = async (text: string) => {
    if (!tempUserId || !username || !activeServer) return;
    
    const msgId = crypto.randomUUID();
    const optimisticMsg: QuickMessage = {
      id: msgId,
      server_id: activeServer.id,
      temp_user_id: tempUserId,
      username,
      mc_username: mcUsername || undefined,
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
      mc_username: mcUsername || null,
      text,
    });

    // Tracking stat
    incrementPlayerStat(tempUserId, "messages_sent");
  };

  const handleSelectServer = async (server: Server) => {
    play("click");
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
      <main className="flex-1 p-6 lg:p-10 overflow-x-hidden font-pixel">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-accent font-black text-primary tracking-tighter uppercase drop-shadow-sm">System Nodes</h1>
          <p className="text-sm text-on-surface-variant font-pixel font-bold opacity-80">Locate and deploy to tactical server nodes across the network.</p>
        </div>
        <button 
          onClick={() => { play("click"); setShowCreateModal(true); }}
          className="mc-button bg-primary text-on-primary text-xs gap-2 font-accent"
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          INITIALIZE NODE
        </button>
      </div>

      {/* ── Server Grid ─────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 border-l-4 border-secondary pl-2">
          <h2 className="font-headline text-base font-bold text-on-surface">Active Servers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-surface-container-low h-48 animate-pulse voxel-border border-2"></div>
          ))
        ) : servers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-surface-container-low voxel-border border-4 border-dashed opacity-50">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">terminal</span>
            <p className="font-bold text-lg">NO ACTIVE NODES DETECTED</p>
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
                className={`bg-surface-container-low border-2 voxel-border transition-all duration-300 group flex flex-col hover:scale-[1.02] active:scale-100 ${
                  isActive ? "border-primary ring-2 ring-primary/20 bg-surface-variant" : "border-on-surface/20 hover:border-primary/40"
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative h-24 overflow-hidden border-b-4 border-on-surface/10 bg-on-surface/5">
                  <img
                    src={getThumb(server.game)}
                    alt={server.game}
                    className="w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity grayscale"
                  />
                  
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div className="bg-surface border-2 border-on-surface px-2 py-0.5 flex items-center gap-2 relative group-hover:z-10">
                        <span className="material-symbols-outlined text-[10px] text-primary">{getGameIcon(server.game)}</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{server.game}</span>
                        {mcStatus[server.id] && mcStatus[server.id].online && (
                          <div className="ml-1 flex items-center gap-1 text-[#00ff00] text-[8px] border-l-2 border-on-surface/20 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff00] animate-pulse"></span>
                            {mcStatus[server.id].ping}MS
                          </div>
                        )}
                      </div>
                      
                      {isHost && (
                        <div className="bg-tertiary text-on-tertiary px-2 py-0.5 text-[8px] font-bold border-2 border-on-surface uppercase tracking-widest">HOST</div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex -space-x-2">
                        {server.players.slice(0, 4).map((p) => (
                           <PixelAvatar size="xs" key={p.id} username={p.username} mcUsername={p.mc_username} className="hover:z-10" />
                        ))}
                        {server.players.length > 4 && (
                          <div className="w-6 h-6 bg-surface-variant border-2 border-on-surface flex items-center justify-center text-[8px] font-bold">+ {server.players.length - 4}</div>
                        )}
                      </div>
                      <div className={`text-[10px] font-bold border-2 px-2 py-0.5 ${fillPct >= 90 ? 'bg-error text-on-error border-on-surface' : 'bg-surface text-on-surface border-on-surface shadow-sm'}`}>
                        {server.players.length}/{server.max_players}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="min-w-0">
                    <h3 className="font-accent text-sm font-black text-on-surface uppercase tracking-tight truncate mb-2">
                      {server.game} SESSION
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {server.tags?.map((tag, i) => (
                        <span key={i} className="text-[8px] font-bold bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-0.5 uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSelectServer(server)}
                      className={`mc-button flex-1 text-[10px] py-2 font-accent ${
                        isJoined ? "bg-secondary text-white border-secondary" : ""
                      }`}
                    >
                      {isActive ? "VIEWING" : isJoined ? "OPEN" : "JOIN NODE"}
                    </button>
                    
                    {isJoined && (
                      <button 
                        onClick={() => handleLeaveServer(server.id)}
                        className="mc-button bg-error text-on-error px-2.5 py-2 group"
                        title="Disconnect"
                      >
                        <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">logout</span>
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
                    className="mc-button bg-error text-on-error font-accent px-6 py-2.5 text-[10px] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Exit Lobby
                  </button>
                <button 
                  onClick={() => { play("click"); setActiveServer(null); }}
                  className="mc-button bg-surface-dim text-on-surface-variant !p-2 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-2xl">expand_more</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md font-pixel">
          <div className="bg-surface-container-highest border-8 border-on-surface shadow-2xl w-full max-w-xl p-8 animate-slide-up max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-accent text-3xl font-black text-on-surface tracking-tighter uppercase">Initialize Node</h2>
              <button onClick={() => { play("click"); setShowCreateModal(false); }} className="mc-button bg-error text-on-error !p-2">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary" /> GAME PROTOCOL
                </label>
                <select
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  className="mc-input w-full p-4 text-base"
                >
                  {Object.entries(GAMES).map(([cat, games]) => (
                    <optgroup key={cat} label={cat} className="font-pixel">
                      {games.map((g) => <option key={g.name} value={g.name} className="font-pixel">{g.name}</option>)}
                    </optgroup>
                  ))}
                  <option value="Custom / Other">Custom / Other</option>
                </select>
                <div className="flex items-center gap-4 p-3 bg-on-surface/5 voxel-border border-4">
                  <img src={getThumb(newGame)} alt={newGame} className="w-16 h-10 object-cover grayscale" />
                  <span className="text-xs font-bold text-on-surface uppercase">{newGame} PROTOCOL ACTIVE</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary" /> CAPACITY
                  </label>
                  <input
                    type="number" min="1" max="100"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="mc-input w-full p-4 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary" /> DEPLOYMENT TAGS
                  </label>
                  <input
                    type="text" placeholder="CHILL, MIC ON..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mc-input w-full p-4 text-base"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary" /> CHOOSE YOUR ROLE
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(ROLES) as RoleType[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { play("click"); setSelectedRole(role); }}
                      className={`voxel-border border-4 p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedRole === role ? 'bg-primary text-on-primary border-primary scale-105 ring-4 ring-primary/30' : 'bg-surface border-on-surface/20 hover:border-primary opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{ROLES[role].icon}</span>
                      <span className="text-[7px] font-bold uppercase">{role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary" /> CONNECTION STRING
                </label>
                <input
                  required type="text"
                  placeholder="DISCORD.GG/INVITE  OR  PLAY.MC-SERVER.COM"
                  value={connectInfo}
                  onChange={(e) => setConnectInfo(e.target.value)}
                  className="mc-input w-full p-4 text-base"
                />
                {connectInfo && (() => {
                  const ct = detectConnectType(connectInfo);
                  const m  = CONNECT_META[ct];
                  return (
                    <div className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold border-4 voxel-border ${m.bg} ${m.color}`}>
                      <span className="material-symbols-outlined text-lg">{m.icon}</span>
                      PROTOCOL DETECTED: {m.label.toUpperCase()}
                    </div>
                  );
                })()}
              </div>

              <button
                type="submit" disabled={isCreating}
                className="mc-button w-full justify-center text-lg bg-primary py-4 disabled:opacity-60"
              >
                {isCreating ? "ENCRYPTING DATA..." : "DEPLOY NODE"}
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
    <div className="flex flex-col xl:flex-row h-full font-pixel bg-surface-container-low">
      {/* LEFT: Lobby Controls & Details */}
      <div className="flex-1 p-6 md:p-10 border-r-4 border-on-surface/10 space-y-10 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface border-4 voxel-border p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">hub</span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Session Commander</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xl font-black text-on-surface uppercase tracking-tight">
                    {server.players.find(p => p.temp_user_id === server.host_id)?.username || 'UNASSIGNED'}
                  </p>
                </div>
              </div>
            </div>

            {/* CAPACITY MODULE */}
            <div className="pt-4 mt-4 border-t-2 border-on-surface/5 flex flex-col items-center justify-center bg-primary/5 p-4 voxel-border border-2 border-dashed">
              <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">CAPACITY MODULE</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-headline font-black text-primary">{server.players.length}</span>
                <span className="text-sm font-headline font-black opacity-20">/</span>
                <span className="text-xl font-headline font-black opacity-40">{server.max_players}</span>
              </div>
              <p className="text-[7px] font-bold uppercase tracking-tighter mt-1 text-primary/60">OPERATIVES ACTIVE</p>
            </div>
            
            <div className="pt-4 border-t-2 border-on-surface/5">
              <button 
                onClick={() => onCopyConnect(getShareUrl(server.id))}
                className="mc-button w-full justify-center gap-3 text-xs"
              >
                <span className="material-symbols-outlined">share</span>
                GENERATE SECURE LINK
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-primary/5 border-4 voxel-border p-6 flex flex-col items-center justify-center text-center">
               <span className="material-symbols-outlined text-4xl text-primary mb-2">radar</span>
               <h3 className="font-accent text-lg font-black uppercase text-on-surface tracking-tighter">Connection Terminal</h3>
               <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Status: Uplink Ready</p>
             </div>

            <button
              onClick={() => onCopyConnect(server.connect_info)}
              className="mc-button w-full bg-on-surface text-surface py-5 group shadow-xl"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
                  {ct === 'steam' ? 'stadium' : ct === 'discord' ? 'forum' : 'lan'}
                </span>
                <span className="text-lg">DOWNLOAD DATA / JOIN NODE</span>
              </div>
            </button>
            
            <div className="bg-on-surface border-x-4 border-b-4 border-on-surface p-4 font-mono text-center">
              <p className="text-xs text-primary-fixed-variant break-all leading-relaxed font-bold animate-pulse">
                {server.connect_info}
              </p>
            </div>
          </div>
        </div>

        {/* Player Roster */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-on-surface/10 pb-2">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-3 h-3 bg-primary" /> ACTIVE ROSTER
            </h3>
            <span className="bg-secondary px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">
              LOBBY STATUS: {server.players.length >= server.max_players ? 'FULL' : 'OPEN'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {server.players.map((p) => (
              <div 
                key={p.id} 
                className={`voxel-border border-2 p-2 flex flex-col items-center text-center gap-1 relative overflow-hidden ${
                  p.temp_user_id === currentUserId 
                  ? 'bg-primary/10 border-primary' 
                  : 'bg-surface border-on-surface/5'
                }`}
              >
                <div className="relative">
                  <PixelAvatar size="sm" username={p.username} mcUsername={p.mc_username} />
                  {p.temp_user_id === server.host_id && (
                    <span className="absolute -top-1 -right-1 material-symbols-outlined text-[10px] text-amber-500 bg-surface rounded-full">stars</span>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <p className="font-accent text-[8px] font-black text-on-surface truncate uppercase leading-tight">
                    {p.username}
                  </p>
                  <p className="text-[6px] font-bold text-primary uppercase tracking-tighter opacity-60">
                    {p.temp_user_id === server.host_id ? 'COMMANDER' : (p.role || 'OPERATIVE')}
                  </p>
                </div>
              </div>
            ))}
            
            {server.players.length < server.max_players && (
               <div className="voxel-border border-2 border-dashed border-on-surface/10 p-2 flex flex-col items-center justify-center opacity-20">
                <span className="text-[10px] font-black">{server.max_players - server.players.length} EMPTY</span>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* RIGHT: Comms Terminal */}
      <div className="w-full xl:w-[400px] flex flex-col bg-surface-container-highest border-l-4 border-on-surface/10">
        <div className="p-4 bg-on-surface/5 border-b-4 border-on-surface/10 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] flex items-center gap-3">
             <span className="material-symbols-outlined text-sm text-primary">sensors</span>
             COMMS TERMINAL
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary">ENCRYPTED</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-on-surface/[0.02]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl animate-pulse">satellite_alt</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">WAITING FOR UPLINK...</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.temp_user_id === currentUserId ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black uppercase ${m.temp_user_id === currentUserId ? "text-primary" : "text-on-surface-variant opacity-70"}`}>
                    {m.username}
                  </span>
                  <span className="text-[6px] opacity-30 font-bold uppercase">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`px-2.5 py-1.5 voxel-border border-2 max-w-[95%] ${
                  m.temp_user_id === currentUserId 
                  ? "bg-primary text-on-primary border-primary" 
                  : "bg-surface text-on-surface border-on-surface/10"
                }`}>
                  <p className="text-[10px] leading-tight font-bold tracking-tight break-words">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t-4 border-on-surface bg-surface-container-high space-y-3">
            {/* Preset quick messages */}
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_MSGS.map((msg) => (
                <button
                  key={msg}
                  onClick={() => onSend(msg)}
                  className="bg-surface border-2 border-on-surface/20 text-[8px] font-black uppercase p-1 hover:border-primary hover:bg-primary/5 transition-all active:translate-y-0.5"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Free text input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="TYPE BROADCAST..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && chatInput.trim() && onSend(chatInput.trim())}
                className="mc-input flex-1 px-3 py-2 text-[10px]"
              />
              <button
                onClick={() => chatInput.trim() && onSend(chatInput.trim())}
                className="mc-button mc-button-primary !px-4"
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
