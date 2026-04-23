import { useCallback, useRef } from "react";

export type SoundType = "click" | "xp" | "error";

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    // Lazy initialize to avoid autoplay issues
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playClick = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Short percussive click (Minecraft UI tap style)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const playXp = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // XP Ding (Minecraft style)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    // Ping starts at around 600Hz and goes to e.g. 1200Hz
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, []);

  const playError = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Low double thud
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.setValueAtTime(60, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  const play = useCallback((type: SoundType) => {
    try {
      if (getAudioContext()?.state === "suspended") {
        getAudioContext()?.resume();
      }
      
      switch (type) {
        case "click": playClick(); break;
        case "xp": playXp(); break;
        case "error": playError(); break;
      }
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }, [playClick, playXp, playError]);

  return { play };
}
