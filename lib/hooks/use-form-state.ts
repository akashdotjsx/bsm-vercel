"use client"

import { useReducer, useCallback } from "react"

interface FormState {
  [key: string]: any
}

interface FormAction {
  type: "SET_FIELD" | "SET_MULTIPLE" | "RESET" | "SET_ALL"
  field?: string
  value?: any
  values?: FormState
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field!]: action.value }
    case "SET_MULTIPLE":
      return { ...state, ...action.values }
    case "SET_ALL":
      return action.values || {}
    case "RESET":
      return action.values || {}
    default:
      return state
  }
}

export function useFormState<T extends FormState>(initialState: T) {
  const [state, dispatch] = useReducer(formReducer, initialState)

  const setField = useCallback((field: keyof T, value: any) => {
    dispatch({ type: "SET_FIELD", field: field as string, value })
  }, [])

  const setMultiple = useCallback((values: Partial<T>) => {
    dispatch({ type: "SET_MULTIPLE", values })
  }, [])

  const reset = useCallback(
    (newState?: T) => {
      dispatch({ type: "RESET", values: newState || initialState })
    },
    [initialState],
  )

  const setAll = useCallback((newState: T) => {
    dispatch({ type: "SET_ALL", values: newState })
  }, [])

  return {
    state: state as T,
    setField,
    setMultiple,
    reset,
    setAll,
  }
}
