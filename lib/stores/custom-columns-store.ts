import { create } from 'zustand'

export interface CustomColumn {
  id: string
  title: string
  type: 'text' | 'number' | 'date'
  options?: string[] // For future use if needed
  defaultValue?: string
  visible?: boolean // Whether the column is visible in the table
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

interface CustomColumnsState {
  columns: CustomColumn[]
  columnValues: Record<string, Record<string, any>> // ticketId -> columnId -> value
  setColumns: (columns: CustomColumn[]) => void
  addColumn: (column: CustomColumn) => void
  removeColumn: (columnId: string) => void
  updateColumn: (columnId: string, updates: Partial<CustomColumn>) => void
  toggleColumnVisibility: (columnId: string) => void
  setColumnValue: (ticketId: string, columnId: string, value: any) => void
  getColumnValue: (ticketId: string, columnId: string) => any
  setColumnValues: (ticketId: string, values: Record<string, any>) => void
  clearAllColumns: () => void
}

export const useCustomColumnsStore = create<CustomColumnsState>()((set, get) => ({
  columns: [],
  columnValues: {},

  setColumns: (columns) => {
    set({ columns })
  },

  addColumn: (column) => {
    set((state) => ({
      columns: [...state.columns, column],
    }))
  },

  removeColumn: (columnId) => {
    set((state) => {
      // Remove column
      const newColumns = state.columns.filter((col) => col.id !== columnId)
      
      // Remove all values for this column
      const newColumnValues = { ...state.columnValues }
      Object.keys(newColumnValues).forEach((ticketId) => {
        delete newColumnValues[ticketId][columnId]
      })

      return {
        columns: newColumns,
        columnValues: newColumnValues,
      }
    })
  },

  updateColumn: (columnId, updates) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    }))
  },

  toggleColumnVisibility: (columnId) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      ),
    }))
  },

  setColumnValue: (ticketId, columnId, value) => {
    set((state) => {
      const newColumnValues = { ...state.columnValues }
      if (!newColumnValues[ticketId]) {
        newColumnValues[ticketId] = {}
      }
      newColumnValues[ticketId][columnId] = value

      return { columnValues: newColumnValues }
    })
  },

  getColumnValue: (ticketId, columnId) => {
    const state = get()
    return state.columnValues[ticketId]?.[columnId]
  },

  setColumnValues: (ticketId, values) => {
    set((state) => ({
      columnValues: {
        ...state.columnValues,
        [ticketId]: values
      }
    }))
  },

  clearAllColumns: () => {
    set({ columns: [], columnValues: {} })
  },
}))
