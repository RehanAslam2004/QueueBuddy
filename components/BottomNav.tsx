"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const itemClass = (path: string) =>
    `flex flex-col items-center justify-center py-1.5 px-1 w-1/4 transition-all active:translate-y-0.5 ${
      isActive(path)
        ? "bg-primary text-on-primary border-b-2 border-on-primary-fixed-variant"
        : "text-on-surface-variant opacity-60 hover:opacity-100"
    }`;

  return (
    <nav className="bg-surface text-[9px] uppercase font-black fixed bottom-0 left-0 w-full z-50 border-t-2 border-outline-variant/20 shadow-[0_-2px_0_0_rgba(0,0,0,0.05)] lg:hidden flex justify-around items-center px-1 pb-safe">
      <Link className={itemClass("/")} href="/">
        <span className="material-symbols-outlined mb-0.5 text-xl">home</span>
        Home
      </Link>
      <Link className={itemClass("/lobbies")} href="/lobbies">
        <span className="material-symbols-outlined mb-0.5 text-xl">dns</span>
        Servers
      </Link>
      <Link className={itemClass("/raids")} href="/raids">
        <span className="material-symbols-outlined mb-0.5 text-xl">swords</span>
        Raids
      </Link>
      <Link className={itemClass("/events")} href="/events">
        <span className="material-symbols-outlined mb-0.5 text-xl">celebration</span>
        Revive
      </Link>
    </nav>
  );
}
