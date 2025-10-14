import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TicketView = 'all' | 'my' | 'assigned'
export type TicketViewType = 'list' | 'kanban'
export type KanbanGroupBy = 'type' | 'status' | 'priority' | 'category'

interface TicketFiltersState {
  // Filter states
  searchTerm: string
  selectedType: string
  selectedPriority: string
  selectedStatus: string
  ticketView: TicketView
  
  // View preferences
  currentView: TicketViewType
  kanbanGroupBy: KanbanGroupBy
  groupBy: string
  
  // Active filters (for advanced filtering)
  activeFilters: {
    type: string[]
    priority: string[]
    status: string[]
    assignee: string[]
    dateRange: { from: string; to: string }
  }
  
  // Actions
  setSearchTerm: (term: string) => void
  setSelectedType: (type: string) => void
  setSelectedPriority: (priority: string) => void
  setSelectedStatus: (status: string) => void
  setTicketView: (view: TicketView) => void
  setCurrentView: (view: TicketViewType) => void
  setKanbanGroupBy: (groupBy: KanbanGroupBy) => void
  setGroupBy: (groupBy: string) => void
  setActiveFilters: (filters: Partial<TicketFiltersState['activeFilters']>) => void
  clearAllFilters: () => void
  reset: () => void
}

const initialState = {
  searchTerm: '',
  selectedType: 'all',
  selectedPriority: 'all',
  selectedStatus: 'all',
  ticketView: 'all' as TicketView,
  currentView: 'list' as TicketViewType,
  kanbanGroupBy: 'type' as KanbanGroupBy,
  groupBy: 'none',
  activeFilters: {
    type: [],
    priority: [],
    status: [],
    assignee: [],
    dateRange: { from: '', to: '' }
  }
}

export const useTicketFiltersStore = create<TicketFiltersState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSelectedPriority: (priority) => set({ selectedPriority: priority }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setTicketView: (view) => set({ ticketView: view }),
      setCurrentView: (view) => set({ currentView: view }),
      setKanbanGroupBy: (groupBy) => set({ kanbanGroupBy: groupBy }),
      setGroupBy: (groupBy) => set({ groupBy }),
      
      setActiveFilters: (filters) => set((state) => ({
        activeFilters: { ...state.activeFilters, ...filters }
      })),
      
      clearAllFilters: () => set({
        searchTerm: '',
        selectedType: 'all',
        selectedPriority: 'all',
        selectedStatus: 'all',
        ticketView: 'all',
        activeFilters: {
          type: [],
          priority: [],
          status: [],
          assignee: [],
          dateRange: { from: '', to: '' }
        }
      }),
      
      reset: () => set(initialState)
    }),
    {
      name: 'ticket-filters-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        currentView: state.currentView,
        kanbanGroupBy: state.kanbanGroupBy,
        groupBy: state.groupBy,
        ticketView: state.ticketView
      })
    }
  )
)
