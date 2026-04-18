"use client";

import { useUI } from "@/hooks/useUI";
import { useIdentity } from "@/hooks/useIdentity";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Drawers() {
  const { settingsOpen, notificationsOpen, setSettingsOpen, setNotificationsOpen } = useUI();
  const { username, setUsername } = useIdentity();
  
  // BUG FIX: newName was initialized with `username || ""` at render time, before
  // Zustand rehydrates from localStorage. This meant the field was always blank on
  // first open. Now synced via useEffect whenever username changes.
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (username) setNewName(username);
  }, [username]);

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      setUsername(newName.trim());
      setSettingsOpen(false);
    }
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
      <div className={`fixed top-0 right-0 h-full w-72 bg-surface-container-high border-l-4 border-outline z-[101] transition-transform duration-300 transform ${settingsOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1 text-xl"
            >
              close
            </button>
          </div>

          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-surface-dim border-2 border-outline-variant/20">
              <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'user'}`}
                alt="Avatar"
                className="w-8 h-8 border-2 border-outline-variant/30"
              />
              <div>
                <p className="font-bold text-xs text-on-surface">{username || "Unknown"}</p>
                <p className="text-[9px] text-on-surface-variant uppercase tracking-widest leading-none">Anonymous Player</p>
              </div>
            </div>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Change Display Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-surface-dim border-none p-3 font-headline font-bold text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter username..."
              />
              <button className="w-full bg-primary text-on-primary font-headline font-black py-2.5 border-b-2 border-on-primary-fixed-variant hover:translate-y-[-1px] active:translate-y-[1px] active:border-b-0 transition-all uppercase text-xs tracking-wider">
                Update Identity
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
