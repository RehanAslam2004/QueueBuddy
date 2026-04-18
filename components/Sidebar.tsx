"use client";

import Link from "next/link";
import { useIdentity } from "@/hooks/useIdentity";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const { username } = useIdentity();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const navItem = (href: string, icon: string, label: string) => (
    <Link
      href={href}
      className={`font-black border-l-4 flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all duration-150 hover:bg-primary/5 active:scale-95 uppercase tracking-widest ${
        isActive(href)
          ? 'bg-primary/10 text-primary border-primary'
          : 'text-on-surface-variant border-transparent'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </Link>
  );

  return (
    <aside className="bg-surface text-on-surface font-body w-40 border-r-2 border-outline-variant/10 hidden lg:flex flex-col h-[calc(100vh-51px)] sticky top-[51px] z-40">
      {/* Player Profile */}
      <div className="px-3 py-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-2.5">
          <img
            alt="Pixel avatar"
            className="w-7 h-7 border-2 border-outline-variant/20 shadow-sm"
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'user'}`}
          />
          <div className="min-w-0">
            <div className="font-black text-on-surface text-[10px] truncate uppercase tracking-tighter">
              {username || "..."}
            </div>
            <div className="text-[8px] text-on-surface-variant uppercase tracking-widest font-black opacity-60">
              Anon Operative
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col py-1 flex-1">
        {navItem('/', 'home', 'Home')}
        {navItem('/lobbies', 'dns', 'Servers')}
        {navItem('/raids', 'swords', 'Raids')}
        {navItem('/events', 'celebration', 'Events')}
      </nav>

      {/* Create Lobby CTA */}
      <div className="p-2 border-t border-outline-variant/10">
        <button
          onClick={() => router.push('/lobbies?create=true')}
          className="w-full bg-primary text-on-primary font-headline font-black py-2.5 text-[10px] border-b-2 border-on-primary-fixed-variant hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 group uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-xs group-hover:rotate-90 transition-transform duration-300">add</span>
          CREATE LOBBY
        </button>
      </div>
    </aside>
  );
}
