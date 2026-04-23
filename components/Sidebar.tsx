"use client";
import Link from "next/link";
import { useIdentity } from "@/hooks/useIdentity";
import { usePathname, useRouter } from "next/navigation";
import { PixelAvatar } from "./PixelAvatar";

export function Sidebar() {
  const { username, mcUsername } = useIdentity();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const navItem = (href: string, icon: string, label: string) => (
    <Link
      href={href}
      className={`font-bold border-l-4 flex items-center gap-3 px-4 py-3 text-xs transition-all duration-150 active:translate-x-1 uppercase tracking-widest ${
        isActive(href)
          ? 'bg-primary/20 text-primary border-primary font-bold'
          : 'text-on-surface-variant border-transparent opacity-70 hover:opacity-100 hover:bg-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </Link>
  );

  return (
    <aside className="bg-surface text-on-surface font-pixel w-48 border-r-4 border-on-surface hidden lg:flex flex-col h-[calc(100vh-56px)] sticky top-[56px] z-40">
      {/* Player Profile */}
      <div className="px-4 py-4 border-b-2 border-on-surface/10 bg-surface-container-low">
        <div className="flex items-center gap-3">
          <PixelAvatar size="md" username={username} mcUsername={mcUsername} />
          <div className="min-w-0">
            <div className="font-bold text-on-surface text-sm truncate uppercase tracking-tighter">
              {username || "..."}
            </div>
            <div className="text-[10px] text-primary uppercase font-bold tracking-tight">
              Level 1 Operative
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col py-2 flex-1 font-pixel font-bold">
        {navItem('/', 'home', 'Home')}
        {navItem('/lobbies', 'dns', 'Servers')}
        {navItem('/raids', 'swords', 'Raids')}
        {navItem('/events', 'celebration', 'Events')}
        {navItem('/inventory', 'inventory_2', 'Vault')}
        {navItem('/achievements', 'emoji_events', 'Hall of Fame')}
      </nav>

      {/* Create Lobby CTA */}
      <div className="p-3 border-t-2 border-on-surface/10">
        <button
          onClick={() => router.push('/lobbies?create=true')}
          className="mc-button mc-button-primary w-full justify-center gap-1.5 py-2 text-[9px] font-accent tracking-tighter"
        >
          <span className="material-symbols-outlined text-sm">add_box</span>
          CREATE LOBBY
        </button>
      </div>
    </aside>
  );
}
