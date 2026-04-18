"use client";

import Link from "next/link";
import { useIdentity } from "@/hooks/useIdentity";
import { useUI } from "@/hooks/useUI";
import { useEffect, useState } from "react";

export function Header() {
  const { username, initialize } = useIdentity();
  const { toggleSettings, toggleNotifications } = useUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, []);

  return (
    <header className="bg-surface font-headline font-bold tracking-tight sticky top-0 z-[60] border-b-2 border-outline-variant/10 flex justify-between items-center w-full px-3 py-1.5">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-black text-primary tracking-tighter hover:scale-105 transition-transform flex items-center gap-2">
          <img src="/Queuebuddy.png" alt="logo" className="w-5 h-5" />
          Queue<span className="text-on-surface">Buddy</span>
        </Link>
      </div>
      <div className="flex items-center gap-0.5 text-primary">
        <button
          onClick={toggleNotifications}
          title="Notifications"
          className="material-symbols-outlined hover:bg-primary/10 p-1.5 active:translate-y-0.5 transition-transform text-[20px]"
        >
          notifications
        </button>
        <button
          onClick={toggleSettings}
          title="Settings"
          className="material-symbols-outlined hover:bg-primary/10 p-1.5 active:translate-y-0.5 transition-transform text-[20px]"
        >
          settings
        </button>
        {mounted && (
          <div className="flex items-center gap-1.5 border-2 border-outline-variant/10 p-0.5 ml-1 bg-surface-container-low">
            <img
              alt="Pixel-art avatar"
              className="w-6 h-6 object-cover border border-outline-variant/10"
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'user'}`}
            />
            <span className="font-body text-[10px] hidden sm:inline-block pr-1.5 text-on-surface truncate max-w-[80px] font-black uppercase tracking-tighter">
              {username || "..."}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
