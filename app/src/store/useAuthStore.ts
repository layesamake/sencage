import { create } from 'zustand';

interface AuthState {
  isLocked: boolean;
  pinCode: string | null;
  setPinCode: (pin: string | null) => void;
  lock: () => void;
  unlock: (pin: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLocked: true,
  pinCode: localStorage.getItem('sengage_pin_code'),
  setPinCode: (pin) => {
    if (pin) {
      localStorage.setItem('sengage_pin_code', pin);
    } else {
      localStorage.removeItem('sengage_pin_code');
    }
    set({ pinCode: pin });
  },
  lock: () => set({ isLocked: true }),
  unlock: (pin) => {
    const correctPin = get().pinCode;
    // S'il n'y a pas de PIN configuré (premier démarrage), on déverrouille directement
    if (pin === correctPin || !correctPin) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },
}));
