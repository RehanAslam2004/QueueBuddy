"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { checkAndConvertExpiredItems } from "@/lib/utils/conversion";
import { GAMES, getGameIcon } from "@/lib/games";
import { PixelAvatar } from "@/components/PixelAvatar";
import { useSound } from "@/hooks/useSound";
import { incrementPlayerStat } from "@/lib/rewards";

const GAME_THUMBS: Record<string, string> = {
  "Minecraft":        "https://lh3.googleusercontent.com/aida-public/AB6AXuB1FnTlxdwd7LErFKBSfO94Eee9I1IE6rQWpvY27rE4dk4FMGjAnv7ZWY6PWWPia0-K2neVE4zy2YuqCyIPNJInjMuGmJzHSJy4o8pnQP_UhFBitbUudbmVDmodl5D_0k1X_D8DUxy2p5ZO_3oRWGi-E0sdLRZVFleeclqxAZM-Ti5ToOnRUuHSw26I-IoFHIMim4C28EOzyu4-4ugGxF3NkWPKmUp8ni8Up22XjRFGS3Uae1vAqTEzhF-ghXfCbNBHubmzmUN_kh-o",
};
const getThumb = (game: string) => GAME_THUMBS[game] ?? GAME_THUMBS["Minecraft"];

export const ROLES: Record<RoleType, { label: string; icon: string }> = {
  tank: { label: 'Tank', icon: 'shield' },
  dps: { label: 'Warrior', icon: 'swords' },
  scout: { label: 'Scout', icon: 'explore' },
  builder: { label: 'Builder', icon: 'construction' },
  mage: { label: 'Mage', icon: 'magic_button' },
};

export type RoleType = 'tank' | 'dps' | 'scout' | 'builder' | 'mage';

function formatTimeLeft(date: Date) {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return "NOW";
    const minDiff = Math.round(diff / (1000 * 60));
    if (minDiff < 60) return `${minDiff}m`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff}h ${minDiff % 60}m`;
    return `${Math.floor(hourDiff / 24)}d`;
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
    mc_username: string | null;
    role: string | null;
}

export default function RaidsPage() {
    const { tempUserId, username, mcUsername } = useIdentity();
    const router = useRouter();
    const { play } = useSound();
    const [sessions, setSessions] = useState<Session[]>([]);
    
    // Form state
    const [game, setGame] = useState("Minecraft");
    const [time, setTime] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(5);
    const [notes, setNotes] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // Join state
    const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState("dps");

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
        play("click");
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
            play("xp");
        } else {
            play("error");
        }
        setIsCreating(false);
    };

    const handleJoinSession = async () => {
        if (!tempUserId || !username || !joiningSessionId) return;
        
        setSessions(prev => prev.map(s => {
            if (s.id !== joiningSessionId) return s;
            return {
                ...s,
                players: [...(s.players || []), {
                    id: 'temp',
                    session_id: joiningSessionId,
                    temp_user_id: tempUserId,
                    username: username,
                    mc_username: mcUsername,
                    role: selectedRole
                }]
            };
        }));
        
        await supabase.from('session_players').insert({
            session_id: joiningSessionId,
            temp_user_id: tempUserId,
            username: username,
            mc_username: mcUsername,
            role: selectedRole
        });
        play("xp");
        incrementPlayerStat(tempUserId, "raids_joined");
        setJoiningSessionId(null);
    }

    const handleLaunchLobby = async (session: Session) => {
        if (!tempUserId || tempUserId !== session.creator_id) return;
        play("click");
        
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
            // Auto join the host with their role if they had one
            const hostPlayer = session.players.find(p => p.temp_user_id === tempUserId);
            await supabase.from('server_players').insert({
                server_id: server.id,
                temp_user_id: tempUserId,
                username: username,
                mc_username: mcUsername,
                role: hostPlayer?.role || 'dps'
            });
            play("xp");
            router.push('/lobbies');
        } else {
            play("error");
        }
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 font-pixel">
            {/* Left Column: Create Form */}
            <section className="xl:col-span-4 flex flex-col gap-6">
                <header className="mb-2">
                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none font-accent">Assemble Squad</h1>
                    <p className="text-xs text-on-surface-variant font-pixel mt-2">Schedule your next tactical drop.</p>
                </header>

                <div className="mc-card bg-surface-container-low relative overflow-hidden">
                    <h2 className="text-xl font-bold text-on-surface mb-6 font-accent uppercase tracking-tighter">Create Raid</h2>
                    
                    <form onSubmit={handleCreateRaid} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Select Target</label>
                            <select 
                                className="w-full mc-input"
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Deploy Time</label>
                                <input 
                                    required
                                    type="datetime-local" 
                                    className="w-full mc-input"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                             <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Max Squad Size</label>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        className="mc-button w-12 h-10 flex items-center justify-center p-0"
                                        onClick={() => { play("click"); setMaxPlayers(Math.max(2, maxPlayers - 1)); }}
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 mc-input text-center py-2 font-bold text-lg">
                                        {maxPlayers}
                                    </div>
                                    <button 
                                        type="button" 
                                        className="mc-button w-12 h-10 flex items-center justify-center p-0"
                                        onClick={() => { play("click"); setMaxPlayers(Math.min(40, maxPlayers + 1)); }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tactical Notes</label>
                            <textarea 
                                placeholder="Requirements, goals, gear..."
                                className="w-full mc-input min-h-[80px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isCreating || !time}
                            className="mc-button mc-button-primary w-full py-4 text-sm font-accent"
                        >
                            {isCreating ? "TRANSMITTING..." : "PUBLISH RAID"}
                        </button>
                    </form>
                </div>
            </section>

            {/* Right Column: Upcoming Raids */}
            <section className="xl:col-span-8 flex flex-col gap-6">
                <div className="flex items-end justify-between border-b-4 border-on-surface/10 pb-4 mb-4">
                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight font-accent">Active Transmissions</h2>
                    <div className="bg-primary/20 text-primary px-3 py-1 text-xs font-black tracking-widest uppercase voxel-border border-2">
                        LIVE_GRID
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map(session => {
                        const isFull = (session.players?.length || 0) >= session.max_players;
                        const isJoined = session.players?.some(p => p.temp_user_id === tempUserId);

                        return (
                            <article key={session.id} className="mc-card p-0 flex flex-col overflow-hidden">
                                <div className="h-24 relative overflow-hidden border-b-4 border-on-surface/10">
                                    <img alt="Game thumb" className="w-full h-full object-cover opacity-30" src={getThumb(session.game)} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    
                                    <div className="absolute top-2 left-2 bg-on-surface text-surface text-[10px] font-black px-2 py-1 uppercase tracking-tighter voxel-border border-2">
                                        {new Date(session.time).toLocaleDateString()}
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-mc-gold text-black text-[10px] font-black px-2 py-1 flex items-center gap-1 voxel-border border-2">
                                        <span className="material-symbols-outlined text-sm">timer</span> 
                                        {formatTimeLeft(new Date(session.time))}
                                    </div>
                                </div>
                                
                                <div className="p-4 flex flex-col gap-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="bg-surface-dim p-2 voxel-border border-2 text-primary shrink-0">
                                            <span className="material-symbols-outlined text-xl">{getGameIcon(session.game)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-accent text-sm text-on-surface truncate uppercase tracking-tight">{session.game}</h3>
                                            <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-tight">{session.notes || "No tactical data available for this operation."}</p>
                                        </div>
                                    </div>

                                    {/* Players Grid */}
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {session.players?.map((p) => (
                                            <div key={p.id} className="flex flex-col items-center gap-1 group relative">
                                                <PixelAvatar 
                                                    username={p.username} 
                                                    mcUsername={p.mc_username} 
                                                    size="md" 
                                                    className={p.temp_user_id === tempUserId ? "border-primary" : ""}
                                                />
                                                <div className="absolute -top-1 -right-1 bg-on-surface text-surface rounded-full w-4 h-4 flex items-center justify-center text-[8px] voxel-border border-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-[10px]">
                                                        {ROLES[p.role as RoleType || 'dps']?.icon || 'person'}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] truncate w-full text-center opacity-70">{p.username}</span>
                                            </div>
                                        ))}
                                        {/* Empty slots */}
                                        {Array.from({ length: Math.min(4, session.max_players - (session.players?.length || 0)) }).map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded bg-surface-dim/30 border-2 border-dashed border-on-surface/10 flex items-center justify-center">
                                                <span className="text-on-surface/10 text-lg">+</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-4 border-t-2 border-on-surface/5">
                                        <div className="bg-black/5 px-3 py-1 voxel-border border-2">
                                            <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">
                                                Squad: {session.players?.length || 0}/{session.max_players}
                                            </span>
                                        </div>
                                        
                                        {!isJoined && !isFull && (
                                            <button 
                                                onClick={() => { play("click"); setJoiningSessionId(session.id); }}
                                                className="mc-button mc-button-primary px-4 py-2 text-[10px] font-accent"
                                            >
                                                JOIN OP
                                            </button>
                                        )}

                                        {isJoined && (
                                            <div className="flex gap-2">
                                                {session.creator_id === tempUserId && (
                                                    <button 
                                                        onClick={() => handleLaunchLobby(session)}
                                                        className="mc-button bg-tertiary px-4 py-2 text-[10px] font-accent text-white"
                                                    >
                                                        LAUNCH OPS
                                                    </button>
                                                )}
                                                {session.creator_id !== tempUserId && (
                                                     <div className="bg-secondary/20 text-secondary px-3 py-1 voxel-border border-2 text-[10px] font-black uppercase">
                                                        READY
                                                     </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Role Selection Modal */}
            {joiningSessionId && (
                <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 font-pixel">
                    <div className="mc-card bg-surface w-full max-w-md shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-accent uppercase text-primary">Choose Your Role</h3>
                            <button onClick={() => { play("click"); setJoiningSessionId(null); }} className="material-symbols-outlined hover:text-error transition-colors">close</button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {Object.entries(ROLES).map(([id, role]) => (
                                <button
                                    key={id}
                                    onClick={() => { play("click"); setSelectedRole(id); }}
                                    className={`flex items-center gap-4 p-4 voxel-border border-2 transition-all ${selectedRole === id ? 'bg-primary text-white border-on-surface' : 'bg-surface-dim hover:bg-surface-variant'}`}
                                >
                                    <span className="material-symbols-outlined text-2xl">{role.icon}</span>
                                    <div className="text-left">
                                        <p className="font-bold text-sm uppercase">{role.label}</p>
                                        <p className="text-[10px] opacity-70">Ready for tactical deployment.</p>
                                    </div>
                                    {selectedRole === id && <span className="material-symbols-outlined ml-auto">check_circle</span>}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleJoinSession}
                            className="mc-button mc-button-primary w-full mt-8 py-4 font-accent text-sm"
                        >
                            CONFIRM DEPLOYMENT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
