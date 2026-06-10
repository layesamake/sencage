import { create } from 'zustand';

export type AppTheme = 'sengage' | 'mixx';

interface AppState {
  isOffline: boolean;
  isSyncing: boolean;
  activeTab: string;
  theme: AppTheme;
  setOffline: (status: boolean) => void;
  setSyncing: (status: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: AppTheme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: !navigator.onLine,
  isSyncing: false,
  activeTab: 'accueil',
  theme: 'sengage', // Default theme
  setOffline: (status) => set({ isOffline: status }),
  setSyncing: (status) => set({ isSyncing: status }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
}));
