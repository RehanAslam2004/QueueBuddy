"use client";

import { useEffect, useState } from "react";
import { useIdentity } from "@/hooks/useIdentity";

export function WelcomeToast() {
  const { username } = useIdentity();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show welcome toast only if it hasn't been shown in this session
    const hasBeenWelcomed = sessionStorage.getItem("qb_welcomed");
    if (!hasBeenWelcomed) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem("qb_welcomed", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] max-w-sm animate-slide-up">
      <div className="bg-surface-container-highest text-on-surface p-6 voxel-border border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,0.4)] relative">
        <button 
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 text-on-surface/40 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-lg font-black">close</span>
        </button>
        
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary animate-float drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">celebration</span>
            <h3 className="font-accent text-2xl uppercase tracking-tighter leading-none text-on-surface">Welcome, Player!</h3>
          </div>
          
          <div className="space-y-3">
            <p className="font-pixel text-[11px] leading-relaxed font-bold uppercase tracking-tight text-on-surface">
              Greetings <span className="text-primary bg-primary/10 px-1">{username}</span>. You've just deployed to QueueBuddy Beta. 
            </p>

            <p className="font-pixel text-[9px] leading-relaxed opacity-70 font-bold uppercase tracking-tighter text-on-surface">
              We're building a barrier-free coordination hub for tactical gaming. Want to help us grow? Contribute on GitHub or reach out via email!
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setShow(false)}
              className="mc-button mc-button-primary !px-6 !py-3 !text-[10px] flex-1 font-black shadow-[0_4px_0_0_#1a5a00]"
            >
              Let's Play
            </button>
            <a 
              href="https://github.com/RehanAslam2004" 
              target="_blank"
              className="mc-button !bg-surface-container-low !text-on-surface !px-6 !py-3 !text-[10px] flex items-center justify-center font-black"
            >
              Contribute
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
