"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GAMES, getGameIcon } from "@/lib/games";

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [game, setGame] = useState("Minecraft");
    const [slots, setSlots] = useState(100);
    const [time, setTime] = useState("");
    const [desc, setDesc] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "voxel-admin") {
            setIsAuthenticated(true);
        } else {
            alert("Wrong password.");
        }
    };

    const fetchEvents = async () => {
        const { data } = await supabase
            .from("events")
            .select("*")
            .order("event_time", { ascending: true });
        if (data) setEvents(data as AppEvent[]);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents();
            const channel = supabase
                .channel("admin_events")
                .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchEvents)
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [isAuthenticated]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from("events").insert({
            title,
            game,
            total_slots: slots,
            event_time: new Date(time).toISOString(),
            description: desc,
            is_featured: isFeatured,
        });
        if (!error) {
            setTitle("");
            setDesc("");
            setTime("");
            setIsFeatured(false);
            showToast("Event deployed successfully!");
            fetchEvents();
        } else {
            showToast("Error creating event: " + error.message);
        }
        setIsSubmitting(false);
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
        <div className="space-y-12">
            <header className="border-b-8 border-primary pb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-5xl font-black text-on-surface tracking-tighter uppercase">
                        Operations Command
                    </h1>
                    <p className="text-on-surface-variant font-body mt-1">Event &amp; System Management</p>
                </div>
                <div className="bg-primary/10 border-4 border-primary/30 px-4 py-2 font-headline font-bold text-sm text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block"></span>
                    {events.length} Events Live
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* ── Create Event Form ─────────────────────────────── */}
                <div className="bg-surface-container p-8 border-4 border-outline-variant/30">
                    <h2 className="font-headline text-2xl font-bold mb-6 border-l-8 border-secondary pl-4">
                        Create New Event
                    </h2>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Event Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-surface-dim p-4 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={game}
                                onChange={(e) => setGame(e.target.value)}
                                className="bg-surface-dim p-4 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
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
                            <input
                                type="number"
                                placeholder="Total Slots"
                                value={slots}
                                onChange={(e) => setSlots(parseInt(e.target.value))}
                                className="bg-surface-dim p-4 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                            />
                        </div>
                        <input
                            type="datetime-local"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full bg-surface-dim p-4 border-none font-headline font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/20"
                        />
                        <textarea
                            placeholder="Event Description (optional)"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full bg-surface-dim p-4 border-none font-body text-on-surface resize-none outline-none focus:ring-4 focus:ring-primary/20"
                            rows={3}
                        />
                        {/* Game Preview */}
                        {game && (
                            <div className="flex items-center gap-4 p-3 bg-surface-dim border-2 border-outline-variant/20">
                                <img
                                    src={getGameThumb(game)}
                                    alt={game}
                                    className="w-14 h-14 object-cover border-2 border-outline-variant/30"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/56x56/1a1a2e/5DBE3C?text=${game.slice(0, 2).toUpperCase()}`; }}
                                />
                                <div>
                                    <p className="font-headline font-bold text-sm">{game}</p>
                                    <p className="text-xs text-on-surface-variant font-body">Selected game thumbnail preview</p>
                                </div>
                            </div>
                        )}
                        <label className="flex items-center gap-3 font-headline font-bold text-sm uppercase cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-6 h-6 rounded-none"
                            />
                            Mark as Featured (Hero Event)
                        </label>
                        <button
                            disabled={isSubmitting}
                            className="w-full bg-secondary text-on-secondary font-headline font-black py-4 border-b-4 border-on-secondary-fixed-variant uppercase tracking-widest active:translate-y-1 active:border-b-0 transition-all disabled:opacity-60"
                        >
                            {isSubmitting ? "Deploying..." : "Deploy Event"}
                        </button>
                    </form>
                </div>

                {/* ── Events List ───────────────────────────────────── */}
                <div className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold border-l-8 border-tertiary pl-4 mb-6">
                        Managed Events
                    </h2>
                    {events.length === 0 && (
                        <div className="py-12 text-center border-4 border-dashed border-outline-variant/30 text-on-surface-variant font-body italic">
                            No events yet. Create one!
                        </div>
                    )}
                    {events.map((ev) => (
                        <div
                            key={ev.id}
                            className={`bg-surface-container-low border-4 transition-all group overflow-hidden ${ev.is_featured ? "border-tertiary shadow-[4px_4px_0_0_rgba(63,134,158,0.4)]" : "border-outline-variant/20 hover:border-outline-variant/60"}`}
                        >
                            <div className="flex items-center gap-4 p-4">
                                {/* Thumbnail */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={getGameThumb(ev.game)}
                                        alt={ev.game}
                                        className="w-20 h-20 object-cover border-4 border-surface-dim"
                                        onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/80x80/1a1a2e/5DBE3C?text=${ev.game.slice(0, 2).toUpperCase()}`; }}
                                    />
                                    {ev.is_featured && (
                                        <div className="absolute -top-1 -right-1 bg-tertiary text-on-tertiary text-[8px] font-black px-1 py-0.5 uppercase">
                                            ★ TOP
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-headline font-bold text-lg truncate">{ev.title}</h3>
                                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest truncate">
                                        {ev.game}
                                    </p>
                                    <div className="flex gap-3 mt-2 text-[10px] font-bold uppercase text-on-surface-variant">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">group</span>
                                            {ev.joined_count}/{ev.total_slots}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">calendar_month</span>
                                            {new Date(ev.event_time).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {/* Mini progress bar */}
                                    <div className="mt-2 h-1.5 bg-surface-dim w-full">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${Math.min(100, Math.round((ev.joined_count / ev.total_slots) * 100))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleFeatured(ev.id, ev.is_featured)}
                                        className={`p-2 border-2 transition-colors ${ev.is_featured ? "bg-tertiary text-on-tertiary border-tertiary" : "border-outline-variant hover:bg-surface-variant"}`}
                                        title={ev.is_featured ? "Unfeature" : "Set as Featured"}
                                    >
                                        <span className="material-symbols-outlined text-sm">{ev.is_featured ? "star" : "star_border"}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(ev.id)}
                                        className="p-2 border-2 border-outline-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                                        title="Delete Event"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-on-surface text-surface px-6 py-3 font-headline font-black border-4 border-surface shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    {toast.toUpperCase()}
                </div>
            )}
        </div>
    );
}
