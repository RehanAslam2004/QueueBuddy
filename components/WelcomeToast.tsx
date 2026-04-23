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
      <div className="bg-primary text-on-primary p-6 voxel-border border-4 border-on-surface shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] relative">
        <button 
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 text-on-primary/50 hover:text-on-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl animate-float">celebration</span>
            <h3 className="font-accent text-xl uppercase tracking-tighter leading-none">Welcome, Player!</h3>
          </div>
          
          <p className="font-pixel text-[11px] leading-relaxed font-bold uppercase tracking-tight">
            Greetings <span className="text-primary-fixed">{username}</span>. You've just deployed to QueueBuddy Beta. 
          </p>

          <p className="font-pixel text-[9px] leading-relaxed opacity-80 font-bold uppercase tracking-tighter">
            We're building a barrier-free coordination hub for tactical gaming. Want to help us grow? Contribute on GitHub or reach out via email!
          </p>

          <div className="flex gap-2">
            <button 
              onClick={() => setShow(false)}
              className="mc-button mc-button-primary !px-4 !py-2 !text-[9px] flex-1"
            >
              Let's Play
            </button>
            <a 
              href="https://github.com/RehanAslam2004" 
              target="_blank"
              className="mc-button !bg-surface !text-on-surface !px-4 !py-2 !text-[9px] flex items-center justify-center"
            >
              Contribute
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
