import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

type AuthStore = {
  user: AuthUser | null;
  activeOrganizationId: string | null;
  setUser: (user: AuthUser | null) => void;
  setActiveOrganizationId: (activeOrganizationId: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  activeOrganizationId: null,
  setUser: (user) => set({ user }),
  setActiveOrganizationId: (activeOrganizationId) =>
    set({ activeOrganizationId }),
  logout: () => set({ user: null, activeOrganizationId: null }),
}));
