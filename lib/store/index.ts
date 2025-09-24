import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  department?: string
  permissions?: string[]
  lastActive?: string
}

interface Ticket {
  id: string
  title: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "critical"
  assignee: string
  reportedBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  category?: string
  tags?: string[]
}

interface Asset {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "maintenance" | "retired"
  location: string
  owner: string
  createdAt: string
  updatedAt: string
  serialNumber?: string
  model?: string
  vendor?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
}

interface SearchState {
  query: string
  results: any[]
  loading: boolean
  filters: Record<string, any>
}

interface GlobalState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  updateUserPermissions: (permissions: string[]) => void

  // Tickets state
  tickets: Ticket[]
  setTickets: (tickets: Ticket[]) => void
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  getTicketsByStatus: (status: string) => Ticket[]
  getTicketsByPriority: (priority: string) => Ticket[]

  // Assets state
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  getAssetsByType: (type: string) => Asset[]
  getAssetsByStatus: (status: string) => Asset[]

  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  getUnreadCount: () => number

  search: SearchState
  setSearchQuery: (query: string) => void
  setSearchResults: (results: any[]) => void
  setSearchLoading: (loading: boolean) => void
  setSearchFilters: (filters: Record<string, any>) => void
  clearSearch: () => void

  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  activeView: "list" | "kanban" | "calendar"
  setActiveView: (view: "list" | "kanban" | "calendar") => void

  // Loading states
  loading: {
    tickets: boolean
    assets: boolean
    user: boolean
    notifications: boolean
    search: boolean
  }
  setLoading: (key: keyof GlobalState["loading"], value: boolean) => void

  cache: {
    timestamps: {
      tickets: number
      assets: number
      notifications: number
    }
    ttl: {
      tickets: number
      assets: number
      notifications: number
    }
  }
  setCacheTimestamp: (key: keyof GlobalState["cache"]["timestamps"]) => void
  isCacheValid: (key: keyof GlobalState["cache"]["timestamps"]) => boolean
  invalidateCache: (key?: keyof GlobalState["cache"]["timestamps"]) => void

  bulkUpdateTickets: (updates: Array<{ id: string; updates: Partial<Ticket> }>) => void
  bulkDeleteTickets: (ids: string[]) => void
  bulkUpdateAssets: (updates: Array<{ id: string; updates: Partial<Asset> }>) => void
  bulkDeleteAssets: (ids: string[]) => void

  // Reset functions
  resetTickets: () => void
  resetAssets: () => void
  resetAll: () => void
}

const DEFAULT_TTL = 5 * 60 * 1000

export const useStore = create<GlobalState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      updateUserPermissions: (permissions) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, permissions } })
        }
      },

      // Tickets state
      tickets: [],
      setTickets: (tickets) => {
        set({
          tickets,
          cache: {
            ...get().cache,
            timestamps: { ...get().cache.timestamps, tickets: Date.now() },
          },
        })
      },
      addTicket: (ticket) => {
        const currentTickets = get().tickets
        set({ tickets: [...currentTickets, ticket] })
      },
      updateTicket: (id, updates) => {
        const currentTickets = get().tickets
        const updatedTickets = currentTickets.map((ticket) =>
          ticket.id === id ? { ...ticket, ...updates, updatedAt: new Date().toISOString() } : ticket,
        )
        set({ tickets: updatedTickets })
      },
      deleteTicket: (id) => {
        const currentTickets = get().tickets
        set({ tickets: currentTickets.filter((ticket) => ticket.id !== id) })
      },
      getTicketsByStatus: (status) => get().tickets.filter((ticket) => ticket.status === status),
      getTicketsByPriority: (priority) => get().tickets.filter((ticket) => ticket.priority === priority),

      // Assets state
      assets: [],
      setAssets: (assets) => {
        set({
          assets,
          cache: {
            ...get().cache,
            timestamps: { ...get().cache.timestamps, assets: Date.now() },
          },
        })
      },
      addAsset: (asset) => {
        const currentAssets = get().assets
        set({ assets: [...currentAssets, asset] })
      },
      updateAsset: (id, updates) => {
        const currentAssets = get().assets
        const updatedAssets = currentAssets.map((asset) =>
          asset.id === id ? { ...asset, ...updates, updatedAt: new Date().toISOString() } : asset,
        )
        set({ assets: updatedAssets })
      },
      deleteAsset: (id) => {
        const currentAssets = get().assets
        set({ assets: currentAssets.filter((asset) => asset.id !== id) })
      },
      getAssetsByType: (type) => get().assets.filter((asset) => asset.type === type),
      getAssetsByStatus: (status) => get().assets.filter((asset) => asset.status === status),

      notifications: [],
      setNotifications: (notifications) => {
        set({
          notifications,
          cache: {
            ...get().cache,
            timestamps: { ...get().cache.timestamps, notifications: Date.now() },
          },
        })
      },
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }
        const currentNotifications = get().notifications
        set({ notifications: [newNotification, ...currentNotifications] })
      },
      markNotificationRead: (id) => {
        const currentNotifications = get().notifications
        const updatedNotifications = currentNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        )
        set({ notifications: updatedNotifications })
      },
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

      search: {
        query: "",
        results: [],
        loading: false,
        filters: {},
      },
      setSearchQuery: (query) => {
        const currentSearch = get().search
        set({ search: { ...currentSearch, query } })
      },
      setSearchResults: (results) => {
        const currentSearch = get().search
        set({ search: { ...currentSearch, results } })
      },
      setSearchLoading: (loading) => {
        const currentSearch = get().search
        set({ search: { ...currentSearch, loading } })
      },
      setSearchFilters: (filters) => {
        const currentSearch = get().search
        set({ search: { ...currentSearch, filters } })
      },
      clearSearch: () => {
        set({
          search: {
            query: "",
            results: [],
            loading: false,
            filters: {},
          },
        })
      },

      // UI state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
      activeView: "list",
      setActiveView: (view) => set({ activeView: view }),

      // Loading states
      loading: {
        tickets: false,
        assets: false,
        user: false,
        notifications: false,
        search: false,
      },
      setLoading: (key, value) => {
        const currentLoading = get().loading
        set({ loading: { ...currentLoading, [key]: value } })
      },

      cache: {
        timestamps: {
          tickets: 0,
          assets: 0,
          notifications: 0,
        },
        ttl: {
          tickets: DEFAULT_TTL,
          assets: DEFAULT_TTL,
          notifications: DEFAULT_TTL,
        },
      },
      setCacheTimestamp: (key) => {
        const currentCache = get().cache
        set({
          cache: {
            ...currentCache,
            timestamps: { ...currentCache.timestamps, [key]: Date.now() },
          },
        })
      },
      isCacheValid: (key) => {
        const { timestamps, ttl } = get().cache
        return Date.now() - timestamps[key] < ttl[key]
      },
      invalidateCache: (key) => {
        const currentCache = get().cache
        if (key) {
          set({
            cache: {
              ...currentCache,
              timestamps: { ...currentCache.timestamps, [key]: 0 },
            },
          })
        } else {
          // Invalidate all caches
          const resetTimestamps = Object.keys(currentCache.timestamps).reduce(
            (acc, k) => {
              acc[k as keyof typeof currentCache.timestamps] = 0
              return acc
            },
            {} as typeof currentCache.timestamps,
          )
          set({
            cache: {
              ...currentCache,
              timestamps: resetTimestamps,
            },
          })
        }
      },

      bulkUpdateTickets: (updates) => {
        const currentTickets = get().tickets
        const updatedTickets = currentTickets.map((ticket) => {
          const update = updates.find((u) => u.id === ticket.id)
          return update ? { ...ticket, ...update.updates, updatedAt: new Date().toISOString() } : ticket
        })
        set({ tickets: updatedTickets })
      },
      bulkDeleteTickets: (ids) => {
        const currentTickets = get().tickets
        set({ tickets: currentTickets.filter((ticket) => !ids.includes(ticket.id)) })
      },
      bulkUpdateAssets: (updates) => {
        const currentAssets = get().assets
        const updatedAssets = currentAssets.map((asset) => {
          const update = updates.find((u) => u.id === asset.id)
          return update ? { ...asset, ...update.updates, updatedAt: new Date().toISOString() } : asset
        })
        set({ assets: updatedAssets })
      },
      bulkDeleteAssets: (ids) => {
        const currentAssets = get().assets
        set({ assets: currentAssets.filter((asset) => !ids.includes(asset.id)) })
      },

      // Reset functions
      resetTickets: () => {
        const currentCache = get().cache
        set({
          tickets: [],
          cache: {
            ...currentCache,
            timestamps: { ...currentCache.timestamps, tickets: 0 },
          },
        })
      },
      resetAssets: () => {
        const currentCache = get().cache
        set({
          assets: [],
          cache: {
            ...currentCache,
            timestamps: { ...currentCache.timestamps, assets: 0 },
          },
        })
      },
      resetAll: () => {
        const currentCache = get().cache
        const resetTimestamps = Object.keys(currentCache.timestamps).reduce(
          (acc, k) => {
            acc[k as keyof typeof currentCache.timestamps] = 0
            return acc
          },
          {} as typeof currentCache.timestamps,
        )

        set({
          tickets: [],
          assets: [],
          notifications: [],
          search: {
            query: "",
            results: [],
            loading: false,
            filters: {},
          },
          cache: {
            ...currentCache,
            timestamps: resetTimestamps,
          },
        })
      },
    })),
    {
      name: "kroolo-bsm-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        activeView: state.activeView,
        cache: state.cache,
      }),
    },
  ),
)

export const useTickets = () => useStore((state) => state.tickets)
export const useAssets = () => useStore((state) => state.assets)
export const useNotifications = () => useStore((state) => state.notifications)
export const useUser = () => useStore((state) => state.user)
export const useSearch = () => useStore((state) => state.search)
export const useLoading = () => useStore((state) => state.loading)
export const useUI = () =>
  useStore((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    theme: state.theme,
    activeView: state.activeView,
  }))
