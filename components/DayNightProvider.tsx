"use client";

import { useEffect } from "react";
import { useDayNight } from "@/hooks/useDayNight";

/**
 * THEME REMOVAL: This provider is now a no-op that ensures 'day' classes are removed if they exist.
 * The platform is permanently locked to the neutral light theme in globals.css.
 */
export function DayNightProvider({ children }: { children: React.ReactNode }) {
  const { update } = useDayNight();

  useEffect(() => {
    // Sync once on mount, but useDayNight is already hardcoded to 'day'.
    update();
    
    // Ensure any legacy classes are cleaned up from body
    const body = document.body;
    body.classList.remove("time-dawn", "time-day", "time-dusk", "time-night");
  }, [update]);

  return <>{children}</>;
}
