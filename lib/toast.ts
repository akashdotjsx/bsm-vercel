/**
 * Centralized toast notification utility
 * 
 * Provides consistent color-coded toast notifications across the application:
 * - Green: Success operations (create, update, complete)
 * - Red: Error operations (delete, failure, validation errors)
 * - Yellow: Warning operations (caution, pending actions)
 * - Blue: Info operations (general information, tips)
 * 
 * Fully supports light and dark modes
 */

import { toast as baseToast } from '@/hooks/use-toast'

export const toast = {
  /**
   * Success toast - Green border and background
   * Use for: Create, Update, Complete, Success operations
   */
  success: (title: string, description?: string) => {
    return baseToast({
      title,
      description,
      variant: 'success',
    })
  },

  /**
   * Error toast - Red border and background
   * Use for: Delete, Failure, Validation errors, Critical issues
   */
  error: (title: string, description?: string) => {
    return baseToast({
      title,
      description,
      variant: 'error',
    })
  },

  /**
   * Warning toast - Yellow border and background
   * Use for: Caution, Pending actions, Important notices
   */
  warning: (title: string, description?: string) => {
    return baseToast({
      title,
      description,
      variant: 'warning',
    })
  },

  /**
   * Info toast - Blue border and background
   * Use for: General information, Tips, Updates
   */
  info: (title: string, description?: string) => {
    return baseToast({
      title,
      description,
      variant: 'info',
    })
  },

  /**
   * Default toast - Uses theme colors
   * Use for: Neutral messages
   */
  default: (title: string, description?: string) => {
    return baseToast({
      title,
      description,
      variant: 'default',
    })
  },
}

export default toast
