"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { checkAndConvertExpiredItems } from "@/lib/utils/conversion";
import { GAMES, getGameIcon } from "@/lib/games";

const GAME_THUMBS: Record<string, string> = {
  "Minecraft":        "https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o",
  "Halo 3":           "https://lh3.googleusercontent.com/aida-public/AB6AXuAEkRfn_0_cp9PBmYYxBfFg_5LbcEPnttJQ9nzauqQe5PASutT8RA7mMZg1sioB3gU7i45GKfoGM50jRo8ScJbHo8Nv_yoKot5Gpvc7_I-iWfIzX3GLHTrXHyu7Fe7faQB1N5vPv5d5Ed8tLhkxB73FVOqAwIOrsd79jUfIL01TfLPhrlCWxGG_zoofahsHqEjO4ZrXK4fu9YPjJVhr0pMj73s8e-Fai33rR8il5yXG4AiHyrIkPUT8igu4SUCTEeH7jLoqpa9FWK2s",
  "Left 4 Dead 2":    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7r92x1DdMuCTjwVkhvneZxWZqh7IzxhUwjibGuna6McEVceTZpoykOWIwO3EL-cXomaNQuhMDriLUFivAo_eaQoP-4-DJl2gQE6ZjSc_FbfOgYwOq_ZiFiStesg9QbRC5X3XIKLpa-MF__qWJB2rXl64vm_fExq46ozSE56IfibSRDN7nGWss5sX_LZyl8usnxQIiitxEigS7jHXAcPBSjx7WvGCfS-IOM8iBlYEC0irFkXklbrZXavyMzaMiNdZkxP80d62w20rr",
  "Team Fortress 2":  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEnRJgLuZIaqX_-6-ARyLJTyzabi7bUrnHuzKrwrs3c_JIXpqe1v3NgPCuUtYy5eenQScUd1XdXWKvHYMRevmsMBodUeYV9fWZExI26UsAIStqI_geY8Ol6S5fbyLv4EJsAaa-KJy3Ut8IDUt7PEQ9QN_LWbcTti5F__Oaql93KHDjX-GRS6adJXkG2r4Oj10Zmw3i6ktDk7wCGZ8bcAiXzmAlYIqv1iqLgYDApy3ktyKJm9bVqey8go7gHOzTpo8kYhF6rNdY5qYK",
  "Garry's Mod":      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V3P0kswVVe4u96b6WyBDtvYv5b-HRLgPljTXSKTbVpr-Tr-D9fDcrHpjfs_F7kr_kY_MXAyy-PGH5Pmb2hLOeIGD0lxr0hwOW2DiOpjYXFIk-nxQ9Iu7R5OiZ2QZ5Hco9lkVOTK_-yrbovDpVcggy8AQhKnE1iY61POqAKErMhLLvkZfUFNyXTnRZrplS8qlbG05kJevrb5D1KeF-E2nRQv8tH8ciC4bKtn0j33zY4FlIpzM6BzXIQ1bFa107MF6_H0Nxu83Q74Z",
};
const getThumb = (game: string) => GAME_THUMBS[game] ?? GAME_THUMBS["Minecraft"];

// For now, let's use standard JS Intl API to avoid needing deps
function formatTimeLeft(date: Date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const minDiff = Math.round(diff / (1000 * 60));
    if (minDiff < 60) return `${minDiff}m`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff}h ${minDiff % 60}m`;
    const dayDiff = Math.floor(hourDiff / 24);
    return `${dayDiff}d ${hourDiff % 24}h`;
}

type Session = {
    id: string;
    game: string;
    time: string;
    max_players: number;
    creator_id: string;
    creator_username: string;
    notes: string;
    players: SessionPlayer[];
};

type SessionPlayer = {
    id: string;
    session_id: string;
    temp_user_id: string;
    username: string;
}

export default function RaidsPage() {
    const { tempUserId, username } = useIdentity();
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    
    // Form state
    const [game, setGame] = useState("Minecraft: Ender Dragon");
    const [time, setTime] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(5);
    const [notes, setNotes] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select(`
                    id, game, time, max_players, creator_id, creator_username, notes
                `)
                .gt('time', new Date().toISOString())
                .order('time', { ascending: true });
            
            if (data) {
                // Fetch players for these sessions
                const sessionIds = data.map(s => s.id);
                if (sessionIds.length > 0) {
                    const { data: playersData } = await supabase
                        .from('session_players')
                        .select('*')
                        .in('session_id', sessionIds);
                        
                    const sessionsWithPlayers = data.map(s => ({
                        ...s,
                        players: playersData?.filter(p => p.session_id === s.id) || []
                    }));
                    setSessions(sessionsWithPlayers as Session[]);
                } else {
                    setSessions(data as any as Session[]);
                }
            }
        };
        fetchSessions();

        const channel = supabase.channel('sessions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchSessions)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players' }, fetchSessions)
            .subscribe();

        const interval = setInterval(checkAndConvertExpiredItems, 10000); // Check every 10s

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    const handleCreateRaid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempUserId || !username || !time) return;
        setIsCreating(true);

        const { data: session, error } = await supabase.from('sessions').insert({
            game,
            time: new Date(time).toISOString(),
            max_players: maxPlayers,
            creator_id: tempUserId,
            creator_username: username,
            notes
        }).select().single();

        if (session) {
            // Auto join the creator
            await supabase.from('session_players').insert({
                session_id: session.id,
                temp_user_id: tempUserId,
                username: username
            });
            // Reset form
            setGame("Minecraft");
            setTime("");
            setMaxPlayers(5);
            setNotes("");
        }
        setIsCreating(false);
    };

    const handleJoinSession = async (sessionId: string) => {
        if (!tempUserId || !username) return;
        
        await supabase.from('session_players').insert({
            session_id: sessionId,
            temp_user_id: tempUserId,
            username: username
        });
    }

    const handleLaunchLobby = async (session: Session) => {
        if (!tempUserId || tempUserId !== session.creator_id) return;
        
        const connectInfo = prompt("Enter Connect Info (Discord link or IP):", "discord.gg/queuebuddy");
        if (!connectInfo) return;

        // Check if already launched
        const { data: existing } = await supabase
            .from('servers')
            .select('id')
            .eq('origin_id', session.id)
            .single();

        if (existing) {
            alert("This operation is already live!");
            router.push('/lobbies');
            return;
        }

        const { data: server, error } = await supabase.from('servers').insert({
            host_id: tempUserId,
            game: session.game,
            max_players: session.max_players,
            connect_info: connectInfo,
            origin_id: session.id,
            status: 'active'
        }).select().single();

        if (server) {
            // Auto join the host
            await supabase.from('server_players').insert({
                server_id: server.id,
                temp_user_id: tempUserId,
                username: username
            });
            router.push('/lobbies');
        }
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Create Form */}
            <section className="xl:col-span-5 flex flex-col gap-8">
                <header className="mb-2">
                    <h1 className="text-xl font-headline font-black text-primary tracking-tighter uppercase leading-none">Assemble Squad</h1>
                    <p className="text-[10px] text-on-surface-variant font-body mt-1">Schedule your next tactical drop.</p>
                </header>

                <div className="bg-surface-container-low p-3 border-4 border-surface-variant relative overflow-hidden">
                    {/* Voxel corner accent */}
                    <div className="absolute top-0 right-0 w-4 h-4 bg-tertiary-container border-b-2 border-l-2 border-surface-variant"></div>
                    <h2 className="text-lg font-headline font-bold text-on-surface mb-4 border-b-2 border-surface-variant pb-2 inline-block pr-4">Create Raid</h2>
                    
                    <form onSubmit={handleCreateRaid} className="flex flex-col gap-4">
                        {/* Game Selector */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest font-body">Select Target</label>
                            <div className="relative">
                                 <select 
                                    className="w-full appearance-none bg-surface-dim voxel-input border-none py-2 px-3 pr-10 text-on-surface font-headline font-medium focus:ring-4 focus:ring-primary-container/30 text-xs"
                                    value={game}
                                    onChange={(e) => setGame(e.target.value)}
                                >
                                    {Object.entries(GAMES).map(([cat, games]) => (
                                        <optgroup key={cat} label={cat}>
                                            {games.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                        </optgroup>
                                    ))}
                                    <option value="Custom / Other">Custom / Other</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tertiary">keyboard_arrow_down</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date/Time */}
                             <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest font-body">Deploy Time</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="datetime-local" 
                                        className="w-full bg-surface-dim voxel-input border-none py-2 px-3 text-on-surface font-headline font-medium focus:ring-4 focus:ring-primary-container/30 text-xs"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            </div>

                            {/* Player Limit */}
                             <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest font-body">Max Squad</label>
                                <div className="relative flex items-center bg-surface-dim voxel-input overflow-hidden">
                                    <button 
                                        type="button" 
                                        className="px-2 py-2 text-on-surface hover:bg-surface-variant transition-colors"
                                        onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                                    >
                                        <span className="material-symbols-outlined text-xs">remove</span>
                                    </button>
                                    <input 
                                        type="number" 
                                        min="2" 
                                        max="40" 
                                        className="w-full bg-transparent border-none text-center font-headline font-bold text-sm p-0 focus:ring-0" 
                                        value={maxPlayers}
                                        readOnly
                                    />
                                    <button 
                                        type="button" 
                                        className="px-2 py-2 text-on-surface hover:bg-surface-variant transition-colors"
                                        onClick={() => setMaxPlayers(Math.min(40, maxPlayers + 1))}
                                    >
                                        <span className="material-symbols-outlined text-xs">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest font-body">Tactical Notes</label>
                            <textarea 
                                placeholder="Requirements, goals, gear..."
                                className="w-full bg-surface-dim voxel-input border-none py-2 px-3 text-on-surface font-body text-xs min-h-[60px] focus:ring-4 focus:ring-primary-container/30"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isCreating || !time}
                            className="disabled:opacity-50 mt-2 w-full py-2.5 bg-primary text-on-primary font-headline font-black text-xs tracking-[0.2em] border-b-4 border-on-primary-fixed-variant active:translate-y-[2px] active:border-b-0 transition-all uppercase flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isCreating ? "TRANSMITTING..." : "PUBLISH RAID"}
                        </button>
                    </form>
                </div>
            </section>

            {/* Right Column: Upcoming Raids */}
            <section className="xl:col-span-7 flex flex-col gap-6">
                 <div className="flex items-end justify-between border-b-2 border-outline-variant/10 pb-2 mb-2 mt-8 xl:mt-0">
                    <h2 className="text-lg font-headline font-black text-on-surface uppercase tracking-tight">Active Transmissions</h2>
                    <div className="flex gap-1">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 text-[8px] font-black tracking-widest uppercase">LIVE_GRID</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3">
                    {sessions.map(session => {
                        const isFull = (session.players?.length || 0) >= session.max_players;
                        const isJoined = session.players?.some(p => p.temp_user_id === tempUserId);

                        return (
                            <article key={session.id} className="bg-surface-container-low flex flex-col border-2 border-outline-variant/10 hover:border-primary/50 transition-all duration-300">
                                <div className="h-16 bg-surface-dim relative overflow-hidden border-b-2 border-outline-variant/10">
                                    <img alt="Game background" className="w-full h-full object-cover opacity-20" src={getThumb(session.game)} />
                                    
                                    <div className="absolute top-1 left-1 bg-on-surface text-surface text-[6px] font-black px-1 py-0.5 font-headline uppercase tracking-widest shadow-sm">
                                        {new Date(session.time).toLocaleDateString()}
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-primary text-on-primary text-[8px] font-black px-1.5 py-0.5 font-headline flex items-center gap-1 shadow-sm">
                                        <span className="material-symbols-outlined text-[10px]">timer</span> 
                                        {formatTimeLeft(new Date(session.time))}
                                    </div>
                                </div>
                                
                                <div className="p-2 flex flex-col flex-1 gap-2">
                                    <div className="flex gap-2 items-start">
                                        <div className="bg-surface-dim p-1 border border-outline-variant/20 text-primary shrink-0">
                                            <span className="material-symbols-outlined text-sm">{getGameIcon(session.game)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-headline font-black text-[11px] text-on-surface truncate uppercase tracking-tight leading-none">{session.game}</h3>
                                            <p className="text-[8px] font-body text-on-surface-variant line-clamp-1 mt-0.5">{session.notes || "No tactical data."}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-outline-variant/10 border-dotted">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex -space-x-1">
                                                {session.players?.slice(0, 3).map((p, i) => (
                                                    <div key={p.id} className="w-5 h-5 border-[1px] border-surface object-cover shadow-sm bg-surface-container" style={{ zIndex: 10 - i }} title={p.username}>
                                                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.username}`} className="w-full h-full" alt="avatar"/>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-black font-headline text-on-surface">
                                                {session.players?.length || 0}/{session.max_players}
                                            </span>
                                        </div>
                                        
                                        {!isJoined && !isFull && (
                                            <button 
                                                onClick={() => handleJoinSession(session.id)}
                                                className="bg-primary text-on-primary font-headline font-black px-2 py-1 text-[8px] border-b-2 border-on-primary-fixed-variant active:translate-y-[1px] active:border-b-0 transition-all uppercase tracking-widest"
                                            >
                                                JOIN
                                            </button>
                                        )}
                                        {isJoined && (
                                            <div className="flex gap-2 items-center">
                                                <span className="text-secondary font-headline font-black text-[8px] uppercase tracking-widest flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                                    READY
                                                </span>
                                                {session.creator_id === tempUserId && (
                                                    <button 
                                                        onClick={() => handleLaunchLobby(session)}
                                                        className="bg-tertiary text-on-tertiary font-headline font-black px-2 py-1 text-[8px] border-b-2 border-on-tertiary-fixed-variant active:translate-y-[1px] active:border-b-0 transition-all uppercase tracking-widest animate-pulse"
                                                    >
                                                        LAUNCH OPS
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!isJoined && isFull && (
                                            <span className="text-on-surface-variant font-headline font-black text-[8px] uppercase tracking-widest opacity-50">
                                                LOCKED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
