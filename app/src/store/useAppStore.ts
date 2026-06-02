import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  isSyncing: boolean;
  activeTab: string;
  setOffline: (status: boolean) => void;
  setSyncing: (status: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: !navigator.onLine,
  isSyncing: false,
  activeTab: 'accueil',
  setOffline: (status) => set({ isOffline: status }),
  setSyncing: (status) => set({ isSyncing: status }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
