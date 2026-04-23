"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { LOOT_ITEMS } from "@/lib/rewards";

export default function InventoryPage() {
  const { tempUserId } = useIdentity();
  const [loot, setLoot] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tempUserId) return;

    const fetchData = async () => {
      const { data: lootData } = await supabase
        .from("loot_drops")
        .select("*")
        .eq("temp_user_id", tempUserId)
        .order("created_at", { ascending: false });

      const { data: statsData } = await supabase
        .from("player_stats")
        .select("*")
        .eq("temp_user_id", tempUserId)
        .single();

      if (lootData) setLoot(lootData);
      if (statsData) setStats(statsData);
      setLoading(false);
    };

    fetchData();
  }, [tempUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="font-headline font-black text-primary animate-pulse uppercase tracking-widest">
          Scanning Vault...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-12">
      <header className="border-b-8 border-primary pb-6">
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">My Vault</h1>
        <p className="text-on-surface-variant font-bold uppercase text-xs tracking-widest opacity-60">Player ID: {tempUserId?.slice(0, 8) || "..."}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 border-4 border-outline-variant/20 flex flex-col items-center">
            <span className="text-4xl font-black text-primary leading-none">{stats?.raids_joined || 0}</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Raids Completed</span>
        </div>
        <div className="bg-surface-container p-6 border-4 border-outline-variant/20 flex flex-col items-center">
            <span className="text-4xl font-black text-secondary leading-none">{stats?.events_joined || 0}</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Events Joined</span>
        </div>
        <div className="bg-surface-container p-6 border-4 border-outline-variant/20 flex flex-col items-center">
            <span className="text-4xl font-black text-tertiary leading-none">{stats?.revivals_completed || 0}</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Revivals Led</span>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            <h2 className="font-headline text-2xl font-black uppercase tracking-tight">Loot Collection</h2>
        </div>

        {loot.length === 0 ? (
            <div className="py-20 text-center border-4 border-dashed border-outline-variant/20">
                <p className="font-headline font-bold text-on-surface-variant uppercase text-sm">Vault is empty.</p>
                <p className="text-[10px] opacity-40 uppercase font-bold mt-1">Complete raids to earn rewards.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loot.map((item) => (
                    <div 
                        key={item.id} 
                        className="bg-surface-container-high border-4 border-outline-variant/10 p-4 aspect-square flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-all relative overflow-hidden"
                    >
                        {/* Rarity Glow */}
                        <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${
                            item.rarity === 'legendary' ? 'bg-amber-500' : 
                            item.rarity === 'epic' ? 'bg-purple-500' :
                            item.rarity === 'rare' ? 'bg-blue-500' : 'bg-transparent'
                        }`} />
                        
                        <span className="font-headline font-black text-[10px] uppercase leading-tight z-10">{item.item_name}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-2 z-10 px-1 py-0.5 ${
                            item.rarity === 'legendary' ? 'text-amber-500' : 
                            item.rarity === 'epic' ? 'text-purple-500' :
                            item.rarity === 'rare' ? 'text-blue-500' : 'text-on-surface-variant opacity-60'
                        }`}>
                            {item.rarity}
                        </span>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  );
}
