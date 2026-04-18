import { create } from 'zustand';

interface UIState {
  settingsOpen: boolean;
  notificationsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  toggleNotifications: () => void;
}

export const useUI = create<UIState>((set) => ({
  settingsOpen: false,
  notificationsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open, notificationsOpen: false }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open, settingsOpen: false }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen, notificationsOpen: false })),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen, settingsOpen: false })),
}));
