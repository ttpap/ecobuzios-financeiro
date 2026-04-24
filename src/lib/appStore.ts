import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AppState = {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeBudgetId: string | null;
  setActiveBudgetId: (id: string | null) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id, activeBudgetId: null }),
      activeBudgetId: null,
      setActiveBudgetId: (id) => set({ activeBudgetId: id }),
    }),
    {
      name: "ecobuzios-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeBudgetId: state.activeBudgetId,
      }),
    }
  )
);
