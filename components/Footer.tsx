import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-on-surface text-surface py-12 px-6 font-pixel border-t-8 border-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-9xl">grid_view</span>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
        {/* About */}
        <div className="space-y-4">
          <h3 className="font-accent text-2xl text-primary-fixed tracking-tighter uppercase">QueueBuddy</h3>
          <p className="text-xs font-bold leading-relaxed opacity-80">
            A real-time multiplayer coordination platform. No accounts, no barriers, just gaming.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a 
              href="https://github.com/RehanAslam2004" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-fixed transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">code</span>
              <span className="text-[10px] font-black uppercase">GitHub</span>
            </a>
            <a 
              href="mailto:rehan2004aslam@gmail.com" 
              className="hover:text-primary-fixed transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              <span className="text-[10px] font-black uppercase">Email</span>
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-fixed">Resources</h3>
          <ul className="space-y-2 text-[11px] font-bold uppercase tracking-widest opacity-70">
            <li><Link href="/lobbies" className="hover:text-primary-fixed transition-colors">Nodes Browser</Link></li>
            <li><Link href="/raids" className="hover:text-primary-fixed transition-colors">Tactical Raids</Link></li>
            <li><Link href="/events" className="hover:text-primary-fixed transition-colors">World Revivals</Link></li>
            <li><Link href="/achievements" className="hover:text-primary-fixed transition-colors">Hall of Fame</Link></li>
          </ul>
        </div>

        {/* Contribution */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-fixed">Contribute</h3>
          <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-tighter">
            QueueBuddy is an open source initiative. Want to build with us? Pull requests are always welcome on GitHub.
          </p>
          <div className="bg-surface/10 p-3 voxel-border border-2 border-dashed border-primary/30">
            <p className="text-[9px] font-black text-primary-fixed italic">
              "Building the future of tactical gaming coordination, one node at a time."
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-surface/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} QueueBuddy Beta. All Rights Reserved.
        </p>
        <div className="flex gap-4 text-[9px] font-black opacity-40 uppercase tracking-[0.3em]">
          <span>Designed for Voxel-Command</span>
          <span className="text-primary-fixed animate-pulse">BETA v1.0.4</span>
        </div>
      </div>
    </footer>
  );
}
