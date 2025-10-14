import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignee: string
  reportedBy: string
  createdAt: string
  dueDate?: string
}

interface Asset {
  id: string
  name: string
  type: string
  status: string
  location: string
  owner: string
}

interface GlobalState {
  // User state
  user: User | null
  setUser: (user: User | null) => void

  // Tickets state
  tickets: Ticket[]
  setTickets: (tickets: Ticket[]) => void
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  deleteTicket: (id: string) => void

  // Assets state
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  deleteAsset: (id: string) => void

  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void

  // Loading states
  loading: {
    tickets: boolean
    assets: boolean
    user: boolean
  }
  setLoading: (key: keyof GlobalState["loading"], value: boolean) => void

  // Cache timestamps
  cacheTimestamps: {
    tickets: number
    assets: number
  }
  setCacheTimestamp: (key: keyof GlobalState["cacheTimestamps"]) => void
}

export const useStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),

      // Tickets state
      tickets: [],
      setTickets: (tickets) =>
        set({
          tickets,
          cacheTimestamps: { ...get().cacheTimestamps, tickets: Date.now() },
        }),
      addTicket: (ticket) =>
        set((state) => ({
          tickets: [...state.tickets, ticket],
        })),
      updateTicket: (id, updates) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) => (ticket.id === id ? { ...ticket, ...updates } : ticket)),
        })),
      deleteTicket: (id) =>
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
        })),

      // Assets state
      assets: [],
      setAssets: (assets) =>
        set({
          assets,
          cacheTimestamps: { ...get().cacheTimestamps, assets: Date.now() },
        }),
      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, asset],
        })),
      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset)),
        })),
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        })),

      // UI state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Loading states
      loading: {
        tickets: false,
        assets: false,
        user: false,
      },
      setLoading: (key, value) =>
        set((state) => ({
          loading: { ...state.loading, [key]: value },
        })),

      // Cache timestamps
      cacheTimestamps: {
        tickets: 0,
        assets: 0,
      },
      setCacheTimestamp: (key) =>
        set((state) => ({
          cacheTimestamps: { ...state.cacheTimestamps, [key]: Date.now() },
        })),
    }),
    {
      name: "kroolo-bsm-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        cacheTimestamps: state.cacheTimestamps,
      }),
    },
  ),
)
