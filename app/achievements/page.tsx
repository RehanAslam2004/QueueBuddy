"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";

import { ACHIEVEMENT_DEF } from "@/lib/rewards";

export default function AchievementsPage() {
  const { tempUserId } = useIdentity();
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tempUserId) return;

    const fetchAch = async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("temp_user_id", tempUserId);
      
      if (data) setAchievements(data.map(a => a.achievement_id));
      setLoading(false);
    };

    fetchAch();
  }, [tempUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="font-headline font-black text-secondary animate-pulse uppercase tracking-widest">
          Recalculating Glory...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-12">
      <header className="border-b-8 border-secondary pb-8">
        <h1 className="font-headline text-6xl font-black uppercase tracking-tighter text-on-surface">Hall of Fame</h1>
        <div className="flex items-center gap-4 mt-2">
            <span className="bg-secondary text-on-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Milestones: {achievements.length} / {Object.keys(ACHIEVEMENT_DEF).length}
            </span>
            <p className="text-on-surface-variant font-bold uppercase text-xs tracking-widest opacity-60">Legacy & Accolades</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(ACHIEVEMENT_DEF).map(([id, def]) => {
          const isUnlocked = achievements.includes(id);
          return (
            <div 
              key={id} 
              className={`group relative p-6 border-4 transition-all duration-500 overflow-hidden ${
                isUnlocked 
                ? "bg-surface-container-highest border-secondary shadow-[12px_12px_0_0_rgba(131,84,37,0.15)] scale-[1.02]" 
                : "bg-surface-container border-on-surface/5 opacity-50 grayscale"
              }`}
            >
              {/* Background Glow */}
              {isUnlocked && (
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary opacity-5 blur-3xl group-hover:opacity-10 transition-opacity" />
              )}
              
              <div className="flex gap-6 items-start relative z-10">
                  <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center voxel-border border-4 ${
                    isUnlocked 
                    ? "bg-secondary text-on-secondary border-on-surface" 
                    : "bg-surface-dim text-on-surface-variant border-on-surface/10"
                  }`}>
                    <span className="material-symbols-outlined text-2xl">{def.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-black uppercase text-base leading-tight mb-1 group-hover:text-secondary transition-colors">
                        {def.title}
                    </h3>
                    <p className="text-[10px] font-bold text-on-surface-variant leading-relaxed opacity-70">
                        {def.desc}
                    </p>
                    
                    {isUnlocked ? (
                      <div className="flex items-center gap-2 mt-3">
                         <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-secondary uppercase tracking-[0.25em]">ACQUIRED</span>
                      </div>
                    ) : (
                        <div className="mt-3 flex items-center gap-2">
                             <span className="material-symbols-outlined text-[10px] opacity-40">lock</span>
                             <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">LOCKED</span>
                        </div>
                    )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
