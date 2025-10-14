"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Mode = "employee" | "customer"

interface ModeContextType {
  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

interface ModeProviderProps {
  children: ReactNode
}

export function ModeProvider({ children }: ModeProviderProps) {
  const [mode, setModeState] = useState<Mode>("employee")

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("kroolo-mode") as Mode
    if (savedMode && (savedMode === "employee" || savedMode === "customer")) {
      setModeState(savedMode)
    }
  }, [])

  const setMode = (newMode: Mode) => {
    setModeState(newMode)
    localStorage.setItem("kroolo-mode", newMode)
  }

  const toggleMode = () => {
    const newMode = mode === "employee" ? "customer" : "employee"
    setMode(newMode)
  }

  return <ModeContext.Provider value={{ mode, setMode, toggleMode }}>{children}</ModeContext.Provider>
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider")
  }
  return context
}
