import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomColumn {
  id: string
  title: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  options?: string[] // For select/multiselect types
  defaultValue?: string
}

interface CustomColumnsState {
  columns: CustomColumn[]
  columnValues: Record<string, Record<string, any>> // ticketId -> columnId -> value
  addColumn: (column: Omit<CustomColumn, 'id'>) => void
  removeColumn: (columnId: string) => void
  updateColumn: (columnId: string, updates: Partial<CustomColumn>) => void
  setColumnValue: (ticketId: string, columnId: string, value: any) => void
  getColumnValue: (ticketId: string, columnId: string) => any
  clearAllColumns: () => void
}

export const useCustomColumnsStore = create<CustomColumnsState>()(
  persist(
    (set, get) => ({
      columns: [],
      columnValues: {},

      addColumn: (column) => {
        const newColumn: CustomColumn = {
          ...column,
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          columns: [...state.columns, newColumn],
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

      clearAllColumns: () => {
        set({ columns: [], columnValues: {} })
      },
    }),
    {
      name: 'custom-columns-storage', // localStorage key
      version: 1,
    }
  )
)
