"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GAMES, getGameIcon } from "@/lib/games";
import { incrementPlayerStat } from "@/lib/rewards";

type AppEvent = {
    id: string;
    game: string;
    title: string;
    total_slots: number;
    joined_count: number;
    event_time: string;
    is_featured: boolean;
    description: string;
};

// Thumbnail map for popular games
const GAME_THUMBNAILS: Record<string, string> = {
  "Minecraft":        "https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o",
  "Halo 3":           "https://lh3.googleusercontent.com/aida-public/AB6AXuAEkRfn_0_cp9PBmYYxBfFg_5LbcEPnttJQ9nzauqQe5PASutT8RA7mMZg1sioB3gU7i45GKfoGM50jRo8ScJbHo8Nv_yoKot5Gpvc7_I-iWfIzX3GLHTrXHyu7Fe7faQB1N5vPv5d5Ed8tLhkxB73FVOqAwIOrsd79jUfIL01TfLPhrlCWxGG_zoofahsHqEjO4ZrXK4fu9YPjJVhr0pMj73s8e-Fai33rR8il5yXG4AiHyrIkPUT8igu4SUCTEeH7jLoqpa9FWK2s",
  "Left 4 Dead 2":    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7r92x1DdMuCTjwVkhvneZxWZqh7IzxhUwjibGuna6McEVceTZpoykOWIwO3EL-cXomaNQuhMDriLUFivAo_eaQoP-4-DJl2gQE6ZjSc_FbfOgYwOq_ZiFiStesg9QbRC5X3XIKLpa-MF__qWJB2rXl64vm_fExq46ozSE56IfibSRDN7nGWss5sX_LZyl8usnxQIiitxEigS7jHXAcPBSjx7WvGCfS-IOM8iBlYEC0irFkXklbrZXavyMzaMiNdZkxP80d62w20rr",
  "Team Fortress 2":  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEnRJgLuZIaqX_-6-ARyLJTyzabi7bUrnHuzKrwrs3c_JIXpqe1v3NgPCuUtYy5eenQScUd1XdXWKvHYMRevmsMBodUeYV9fWZExI26UsAIStqI_geY8Ol6S5fbyLv4EJsAaa-KJy3Ut8IDUt7PEQ9QN_LWbcTti5F__Oaql93KHDjX-GRS6adJXkG2r4Oj10Zmw3i6ktDk7wCGZ8bcAiXzmAlYIqv1iqLgYDApy3ktyKJm9bVqey8go7gHOzTpo8kYhF6rNdY5qYK",
  "Garry's Mod":      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V3P0kswVVe4u96b6WyBDtvYv5b-HRLgPljTXSKTbVpr-Tr-D9fDcrHpjfs_F7kr_kY_MXAyy-PGH5Pmb2hLOeIGD0lxr0hwOW2DiOpjYXFIk-nxQ9Iu7R5OiZ2QZ5Hco9lkVOTK_-yrbovDpVcggy8AQhKnE1iY61POqAKErMhLLvkZfUFNyXTnRZrplS8qlbG05kJevrb5D1KeF-E2nRQv8tH8ciC4bKtn0j33zY4FlIpzM6BzXIQ1bFa107MF6_H0Nxu83Q74Z",
};

const getGameThumb = (game: string) =>
    GAME_THUMBNAILS[game] ||
    `https://via.placeholder.com/80x80/1a1a2e/5DBE3C?text=${encodeURIComponent(game.slice(0, 2).toUpperCase())}`;

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [lobbies, setLobbies] = useState<any[]>([]);
    const [raids, setRaids] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"events" | "moderation">("events");

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [game, setGame] = useState("Minecraft");
    const [slots, setSlots] = useState(100);
    const [time, setTime] = useState("");
    const [desc, setDesc] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("qb_admin_auth");
        if (saved === "voxel-admin") setIsAuthenticated(true);
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "voxel-admin") {
            setIsAuthenticated(true);
            localStorage.setItem("qb_admin_auth", "voxel-admin");
        } else {
            alert("Wrong password.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("qb_admin_auth");
        setIsAuthenticated(false);
    };

    const fetchEvents = async () => {
        const { data } = await supabase
            .from("events")
            .select("*")
            .order("event_time", { ascending: true });
        if (data) setEvents(data as AppEvent[]);
    };

    const fetchModerationData = async () => {
        const { data: s } = await supabase.from("servers").select("*, server_players(count)");
        const { data: r } = await supabase.from("sessions").select("*, session_players(count)");
        if (s) setLobbies(s);
        if (r) setRaids(r);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents();
            fetchModerationData();
            const channel = supabase
                .channel("admin_updates")
                .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchEvents)
                .on("postgres_changes", { event: "*", schema: "public", table: "servers" }, fetchModerationData)
                .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, fetchModerationData)
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [isAuthenticated]);

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            title,
            game,
            total_slots: slots,
            event_time: new Date(time).toISOString(),
            description: desc,
            is_featured: isFeatured,
        };

        let result;
        if (editingId) {
            result = await supabase.from("events").update(payload).eq("id", editingId);
        } else {
            result = await supabase.from("events").insert(payload);
        }

        if (!result.error) {
            setTitle("");
            setDesc("");
            setTime("");
            setIsFeatured(false);
            setEditingId(null);
            showToast(editingId ? "Event updated! ✅" : "Event deployed successfully! 🚀");
            fetchEvents();
        } else {
            showToast("Error: " + result.error.message);
        }
        setIsSubmitting(false);
    };

    const startEdit = (ev: AppEvent) => {
        setEditingId(ev.id);
        setTitle(ev.title);
        setGame(ev.game);
        setSlots(ev.total_slots);
        // Correctly format string for datetime-local
        const d = new Date(ev.event_time);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setTime(d.toISOString().slice(0, 16));
        setDesc(ev.description || "");
        setIsFeatured(ev.is_featured);
        setActiveTab("events");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setDesc("");
        setTime("");
        setIsFeatured(false);
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Delete this event permanently?")) return;
        await supabase.from("events").delete().eq("id", id);
        showToast("Event removed.");
        fetchEvents();
    };

    const toggleFeatured = async (id: string, current: boolean) => {
        if (!current) {
            await supabase.from("events").update({ is_featured: false }).neq("id", id);
        }
        await supabase.from("events").update({ is_featured: !current }).eq("id", id);
        showToast(current ? "Removed from featured." : "Set as featured event!");
        fetchEvents();
    };

    const terminateLobby = async (id: string) => {
        if (!confirm("Terminate this server lobby?")) return;
        
        // Fetch players to award revivals (simulated)
        const { data: players } = await supabase.from('server_players').select('temp_user_id').eq('server_id', id);
        if (players) {
            for (const p of players) {
                await incrementPlayerStat(p.temp_user_id, "revivals_completed");
            }
        }

        await supabase.from("servers").delete().eq("id", id);
        showToast("Lobby terminated. Revivals credited.");
    };

    const terminateRaid = async (id: string) => {
        if (!confirm("Terminate this scheduled raid?")) return;
        await supabase.from("sessions").delete().eq("id", id);
        showToast("Raid terminated.");
    };

    // ─── Login Gate ───────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-surface-container-high border-8 border-outline p-8 w-full max-w-md shadow-[16px_16px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-primary">
                        <span className="material-symbols-outlined text-4xl text-primary">security</span>
                        <h1 className="font-headline text-3xl font-black uppercase tracking-tighter">Admin Access</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <input
                            type="password"
                            placeholder="Enter voxel-admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-dim border-none p-4 font-headline text-on-surface outline-none focus:ring-4 focus:ring-primary/20 shadow-[inset_0_4px_0_0_rgba(0,0,0,0.1)]"
                        />
                        <button className="w-full bg-primary text-on-primary font-headline font-black py-4 border-b-8 border-on-primary-fixed-variant active:translate-y-2 active:border-b-0 transition-all uppercase tracking-widest">
                            Authorize
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── Authenticated Dashboard ──────────────────────────────────
    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
            <header className="border-b-8 border-primary pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tighter uppercase leading-none">
                        Operations Command
                    </h1>
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mt-2 opacity-70">
                        System Level Authorization: <span className="text-primary italic">VOXEL-ADMIN-01</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/5 border-2 border-primary/20 p-3 flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="font-headline font-black text-lg text-primary leading-none">{events.length + lobbies.length + raids.length}</span>
                        </div>
                        <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Live Assets</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-surface-dim hover:bg-error/10 text-on-surface-variant hover:text-error p-3 aspect-square border-b-4 border-outline-variant active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center"
                        title="Deauthorize"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            {/* Tactical Tabs */}
            <div className="flex gap-2 border-b-4 border-outline-variant/10">
                <button 
                    onClick={() => setActiveTab("events")}
                    className={`px-6 py-3 font-headline font-black text-sm uppercase tracking-widest transition-all border-b-4 ${activeTab === "events" ? "bg-primary text-on-primary border-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container border-transparent"}`}
                >
                    Event Intel
                </button>
                <button 
                    onClick={() => setActiveTab("moderation")}
                    className={`px-6 py-3 font-headline font-black text-sm uppercase tracking-widest transition-all border-b-4 ${activeTab === "moderation" ? "bg-secondary text-on-secondary border-on-secondary-fixed" : "text-on-surface-variant hover:bg-surface-container border-transparent"}`}
                >
                    Oversight
                </button>
            </div>

            {activeTab === "events" ? (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* ── Create / Edit Event Form ─────────────────────── */}
                    <div className="lg:col-span-5 bg-surface-container p-6 border-4 border-outline-variant/30 sticky top-6">
                        <div className="flex items-center justify-between mb-6 border-l-8 border-secondary pl-4">
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">
                                {editingId ? "Reconfigure Opts" : "Deploy New Ops"}
                            </h2>
                            {editingId && (
                                <button onClick={cancelEdit} className="text-[10px] font-black text-error uppercase underline">Cancel</button>
                            )}
                        </div>
                        
                        <form onSubmit={handleSaveEvent} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Transmission Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter operation name..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full bg-surface-dim p-3 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Target Platform</label>
                                    <select
                                        value={game}
                                        onChange={(e) => setGame(e.target.value)}
                                        className="w-full bg-surface-dim p-3 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20 text-sm"
                                    >
                                        {Object.entries(GAMES).map(([cat, games]) => (
                                            <optgroup key={cat} label={cat}>
                                                {games.map((g) => (
                                                    <option key={g.name} value={g.name}>{g.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        <option value="Custom / Other">Custom / Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Max Capacity</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={slots}
                                        onChange={(e) => setSlots(parseInt(e.target.value))}
                                        className="w-full bg-surface-dim p-3 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Deployment Window (Local)</label>
                                <input
                                    type="datetime-local"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    className="w-full bg-surface-dim p-3 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20 text-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Mission Details</label>
                                <textarea
                                    placeholder="Briefing notes..."
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    className="w-full bg-surface-dim p-3 border-none font-body text-on-surface resize-none outline-none focus:ring-4 focus:ring-primary/20 text-xs min-h-[80px]"
                                />
                            </div>

                            <div className="p-3 bg-surface-dim/50 border-2 border-outline-variant/10 flex items-center justify-between">
                                <label className="flex items-center gap-3 font-headline font-black text-[10px] uppercase cursor-pointer text-on-surface-variant">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="w-5 h-5 rounded-none border-2 border-outline-variant"
                                    />
                                    Prioritize Feed (Hero)
                                </label>
                                {game && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">{getGameIcon(game)}</span>
                                        <span className="text-[10px] font-bold opacity-60 uppercase">{game}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={isSubmitting}
                                className={`w-full font-headline font-black py-4 border-b-4 transition-all uppercase tracking-widest active:translate-y-1 active:border-b-0 disabled:opacity-60 text-sm ${editingId ? 'bg-tertiary text-on-tertiary border-on-tertiary-fixed' : 'bg-secondary text-on-secondary border-on-secondary-fixed'}`}
                            >
                                {isSubmitting ? "TRANSMITTING..." : editingId ? "COMMIT UPDATE" : "BROADCAST EVENT"}
                            </button>
                        </form>
                    </div>

                    {/* ── Events List ───────────────────────────────────── */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between mb-4 border-l-8 border-tertiary pl-4">
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Active Intel</h2>
                            <p className="text-[9px] font-black uppercase opacity-40">{events.length} records</p>
                        </div>
                        
                        {events.length === 0 && (
                            <div className="py-20 text-center border-4 border-dashed border-outline-variant/30 text-on-surface-variant font-headline font-bold uppercase text-xs">
                                No transmissions found.
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-3">
                            {events.map((ev) => (
                                <div
                                    key={ev.id}
                                    className={`bg-surface-container-low border-4 transition-all group overflow-hidden ${ev.is_featured ? "border-tertiary" : "border-outline-variant/10 hover:border-outline-variant/30"}`}
                                >
                                    <div className="flex items-center gap-4 p-3">
                                        <div className="relative flex-shrink-0 w-16 h-12 bg-surface-dim overflow-hidden border-2 border-outline-variant/20">
                                            <img
                                                src={GAME_THUMBNAILS[ev.game] || `https://via.placeholder.com/80x80/222/555?text=${ev.game[0]}`}
                                                alt={ev.game}
                                                className="w-full h-full object-cover"
                                            />
                                            {ev.is_featured && (
                                                <div className="absolute top-0 left-0 bg-tertiary text-on-tertiary text-[7px] font-black px-1 uppercase leading-none py-0.5">TOP</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-headline font-black text-sm uppercase truncate leading-none mb-1">{ev.title}</h3>
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{ev.game}</span>
                                                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                                                <span className="text-[9px] font-bold text-on-surface-variant uppercase">{new Date(ev.event_time).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => startEdit(ev)}
                                                className="p-2 border-2 border-outline-variant/20 hover:bg-primary-container/20 hover:border-primary/50 transition-all aspect-square"
                                                title="Reconfigure"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => toggleFeatured(ev.id, ev.is_featured)}
                                                className={`p-2 border-2 transition-all aspect-square ${ev.is_featured ? "bg-tertiary text-on-tertiary border-tertiary" : "border-outline-variant/20 hover:bg-surface-variant"}`}
                                                title="Toggle Priority"
                                            >
                                                <span className="material-symbols-outlined text-sm">star</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(ev.id)}
                                                className="p-2 border-2 border-outline-variant/20 hover:bg-error/10 hover:border-error/50 hover:text-error transition-all aspect-square"
                                                title="Delete"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Mini progress line */}
                                    <div className="h-1 bg-surface-dim w-full">
                                        <div
                                            className="h-full bg-primary transition-all duration-700"
                                            style={{ width: `${Math.min(100, Math.round((ev.joined_count / ev.total_slots) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="space-y-10">
                    {/* Lobbies Oversight */}
                    <div className="space-y-4">
                        <div className="flex items-end justify-between border-l-8 border-primary pl-4">
                            <h2 className="font-headline text-xl font-black uppercase tracking-tight">Active Lobby Streams</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lobbies.length === 0 && <p className="text-xs font-body italic p-4 bg-surface-container-low border-2 border-dashed border-outline-variant/20 text-center col-span-full">No active server lobes.</p>}
                            {lobbies.map(l => (
                                <div key={l.id} className="bg-surface-container-low border-4 border-outline-variant/10 p-4 flex justify-between items-center group">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{l.game}</p>
                                        <div className="flex gap-1 mt-0.5">
                                            {l.tags?.map((tag: string) => (
                                                <span key={tag} className="text-[6px] font-black bg-surface-container px-1 py-0.5 opacity-60">#{tag}</span>
                                            ))}
                                        </div>
                                        <p className="text-[8px] opacity-40 uppercase font-bold mt-1">Host ID: {l.host_id.slice(0, 8)}...</p>
                                    </div>
                                    <button 
                                        onClick={() => terminateLobby(l.id)}
                                        className="bg-error/5 text-error p-2 border border-error/20 hover:bg-error hover:text-white transition-all opacity-40 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raids Oversight */}
                    <div className="space-y-4">
                        <div className="flex items-end justify-between border-l-8 border-secondary pl-4">
                            <h2 className="font-headline text-xl font-black uppercase tracking-tight">Scheduled Raids</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {raids.length === 0 && <p className="text-xs font-body italic p-4 bg-surface-container-low border-2 border-dashed border-outline-variant/20 text-center col-span-full">No transmissions scheduled.</p>}
                            {raids.map(r => (
                                <div key={r.id} className="bg-surface-container-low border-4 border-outline-variant/10 p-4 flex justify-between items-center group">
                                    <div>
                                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{r.game}</p>
                                        <p className="text-[8px] opacity-40 uppercase font-bold mt-1">Status: DEPLOYED {new Date(r.time).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => terminateRaid(r.id)}
                                        className="bg-error/5 text-error p-2 border border-error/20 hover:bg-error hover:text-white transition-all opacity-40 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Toast System */}
            {toast && (
                <div className="fixed bottom-12 right-12 z-[200] bg-on-surface text-surface px-6 py-4 font-headline font-black border-l-[12px] border-primary shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] flex items-center gap-4 animate-slide-in">
                    <span className="material-symbols-outlined text-primary">terminal</span>
                    <span className="text-sm tracking-tight">{toast.toUpperCase()}</span>
                </div>
            )}
        </div>
    );
}
