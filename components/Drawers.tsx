"use client";
"use client";

import { useUI } from "@/hooks/useUI";
import { useIdentity } from "@/hooks/useIdentity";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Drawers() {
  const { settingsOpen, notificationsOpen, setSettingsOpen, setNotificationsOpen } = useUI();
  const { username, setUsername, mcUsername, setMcUsername } = useIdentity();
  const [newName, setNewName] = useState("");
  const [newMcName, setNewMcName] = useState("");

  useEffect(() => {
    if (username) setNewName(username);
    if (mcUsername) setNewMcName(mcUsername);
  }, [username, mcUsername]);

  const handleUpdateIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      setUsername(newName.trim());
    }
    setMcUsername(newMcName.trim() || null);
    setSettingsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {(settingsOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm transition-opacity"
          onClick={() => { setSettingsOpen(false); setNotificationsOpen(false); }}
        />
      )}

      {/* ── Settings Drawer ──────────────────────────────── */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-surface-container-high border-l-4 border-on-surface z-[101] transition-transform duration-300 transform ${settingsOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto font-pixel`}>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight font-accent">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1 text-xl"
            >
              close
            </button>
          </div>

          {/* Identity Section */}
          <div className="space-y-4">
            <div className="mc-card flex items-center gap-4 bg-mc-stone/20">
              <div className="w-12 h-12 bg-black/10 voxel-border flex items-center justify-center p-1">
                {mcUsername ? (
                  <img
                    src={`https://mc-heads.net/avatar/${mcUsername}`}
                    alt="MC Skin"
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'user'}`}
                    alt="Avatar"
                    className="w-full h-full"
                  />
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-on-surface leading-none">{username || "Unknown"}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                  {mcUsername ? `Sync: ${mcUsername}` : "Anonymous Player"}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateIdentity} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mc-input"
                  placeholder="Enter username..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-primary-container-variant uppercase tracking-widest flex items-center gap-1">
                  Minecraft Username 
                  <span className="text-[8px] bg-primary/20 px-1 rounded">SKIN SYNC</span>
                </label>
                <input
                  type="text"
                  value={newMcName}
                  onChange={(e) => setNewMcName(e.target.value)}
                  className="w-full mc-input"
                  placeholder="e.g. Dream, Notch..."
                />
                <p className="text-[9px] text-on-surface-variant leading-tight">
                  Enter your MC name to show your real skin across the platform.
                </p>
              </div>

              <button className="w-full mc-button mc-button-primary">
                Update Profile
              </button>
            </form>
          </div>

          {/* Admin Link */}
          <div className="pt-4 border-t-2 border-outline-variant/20 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant leading-none">Administration</p>
            <Link
              href="/admin"
              onClick={() => setSettingsOpen(false)}
              className="flex items-center gap-3 p-3 bg-tertiary-container text-on-tertiary-container font-headline font-bold text-xs border-b-2 border-tertiary active:translate-y-1 transition-all hover:brightness-95"
            >
              <span className="material-symbols-outlined text-lg">security</span>
              Operations Command
            </Link>
          </div>

          {/* Version Info */}
          <div className="pt-4 border-t-2 border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-body">
              QueueBuddy v1.0 · Anonymous-first gaming platform
            </p>
          </div>
        </div>
      </div>

      {/* ── Notifications Drawer ─────────────────────────── */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-surface-container-high border-l-4 border-outline z-[101] transition-transform duration-300 transform ${notificationsOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">Alerts</h2>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1 text-xl"
            >
              close
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-surface-dim border-l-4 border-primary flex gap-2">
              <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5 text-xl">campaign</span>
              <div>
                <p className="text-xs font-bold text-on-surface">Welcome to QueueBuddy!</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Your anonymous identity has been generated. Ready to find your next squad?</p>
              </div>
            </div>
            <div className="p-3 bg-surface-dim border-l-4 border-secondary flex gap-2">
              <span className="material-symbols-outlined text-secondary flex-shrink-0 mt-0.5 text-xl">public</span>
              <div>
                <p className="text-xs font-bold text-on-surface">Revive World is Live!</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Community events are running. Join before slots fill up!</p>
              </div>
            </div>
            <div className="p-3 bg-surface-dim border-l-4 border-tertiary flex gap-2">
              <span className="material-symbols-outlined text-tertiary flex-shrink-0 mt-0.5 text-xl">info</span>
              <div>
                <p className="text-xs font-bold text-on-surface">No Login Required</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">QueueBuddy is 100% anonymous. Your ID is stored locally only.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
