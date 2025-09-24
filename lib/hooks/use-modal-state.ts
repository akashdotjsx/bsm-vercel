"use client"

import { useState, useCallback } from "react"

export function useModalState() {
  const [modals, setModals] = useState<Record<string, boolean>>({})

  const openModal = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: true }))
  }, [])

  const closeModal = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: false }))
  }, [])

  const toggleModal = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }))
  }, [])

  const isOpen = useCallback(
    (modalName: string) => {
      return Boolean(modals[modalName])
    },
    [modals],
  )

  const closeAll = useCallback(() => {
    setModals({})
  }, [])

  return {
    openModal,
    closeModal,
    toggleModal,
    isOpen,
    closeAll,
  }
}
