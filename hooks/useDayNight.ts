import { create } from 'zustand';

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface DayNightState {
  timeOfDay: TimeOfDay;
  hour: number;
  update: () => void;
}

// THEME REMOVAL: Permanently locking the platform to 'day' mode.
export const useDayNight = create<DayNightState>((set) => ({
  hour: 12, // Fixed to noon
  timeOfDay: 'day',
  update: () => {
    // No-op: The cycle is disabled.
  },
}));
