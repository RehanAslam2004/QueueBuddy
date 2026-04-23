"use client";
import Link from "next/link";
import { useIdentity } from "@/hooks/useIdentity";
import { useUI } from "@/hooks/useUI";
import { useEffect, useState } from "react";
import { PixelAvatar } from "./PixelAvatar";

export function Header() {
  const { username, mcUsername, initialize } = useIdentity();
  const { toggleSettings, toggleNotifications } = useUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, []);

  return (
    <header className="bg-surface font-pixel sticky top-0 z-[60] border-b-4 border-on-surface flex justify-between items-center w-full px-4 py-2">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-black text-primary tracking-tighter hover:scale-105 transition-transform uppercase font-accent">
          QUEUE<span className="text-on-surface">BUDDY</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 text-primary">
        <button
          onClick={toggleNotifications}
          title="Notifications"
          className="material-symbols-outlined hover:bg-primary/10 p-2 active:translate-y-1 transition-transform text-2xl"
        >
          notifications
        </button>
        <button
          onClick={toggleSettings}
          title="Settings"
          className="material-symbols-outlined hover:bg-primary/10 p-2 active:translate-y-1 transition-transform text-2xl"
        >
          settings
        </button>
        {mounted && (
          <div 
            onClick={toggleSettings}
            className="flex items-center gap-3 voxel-border border-2 p-1 pl-2 ml-2 bg-surface-container-low cursor-pointer hover:bg-surface-variant transition-colors"
          >
            <span className="text-xs hidden sm:inline-block text-on-surface truncate max-w-[100px] font-bold uppercase tracking-tight">
              {username || "..."}
            </span>
            <PixelAvatar size="sm" username={username} mcUsername={mcUsername} />
          </div>
        )}
      </div>
    </header>
  );
}
