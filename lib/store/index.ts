import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface GlobalState {
  // User state (from auth)
  user: User | null
  setUser: (user: User | null) => void

  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void

  // Global loading states (for UI feedback)
  loading: {
    global: boolean
    user: boolean
  }
  setLoading: (key: keyof GlobalState["loading"], value: boolean) => void
}

export const useStore = create<GlobalState>()(
  persist(
    (set) => ({
      // ✅ User state (from authentication)
      user: null,
      setUser: (user) => set({ user }),

      // ✅ UI state (local preferences)
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // ✅ Global loading states (for UI feedback)
      loading: {
        global: false,
        user: false,
      },
      setLoading: (key, value) =>
        set((state) => ({
          loading: { ...state.loading, [key]: value },
        })),
    }),
    {
      name: "kroolo-bsm-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences and auth state
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)
