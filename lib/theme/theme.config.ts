/**
 * Kroolo BSM - Centralized Theme Configuration
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all theme values.
 * Change values here to affect the entire application.
 */

export const themeConfig = {
  /**
   * Typography System
   * Controls all font-related properties across the app
   */
  typography: {
    /**
     * Font Families
     * - primary: Main font used throughout the app (Inter)
     * - mono: Monospace font for code/technical content
     */
    fontFamily: {
      primary: 'var(--font-inter)',
      mono: 'var(--font-mono)',
      sans: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif',
    },

    /**
     * Font Sizes
     * Standard sizes used across the application
     * Change these to scale text globally
     */
    fontSize: {
      xs: '10px',      // Extra small - labels, tiny text
      sm: '12px',      // Small - secondary text, captions
      base: '13px',    // Base/default - body text
      md: '14px',      // Medium - emphasis text
      lg: '16px',      // Large - subheadings
      xl: '18px',      // Extra large - headings
      '2xl': '24px',   // 2X large - page titles
      '3xl': '30px',   // 3X large - hero text
      '4xl': '36px',   // 4X large - major headings
    },

    /**
     * Font Weights
     * Consistent weight scale
     */
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },

    /**
     * Line Heights
     * Controls vertical spacing between lines
     */
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },

    /**
     * Letter Spacing
     * Controls horizontal spacing between characters
     */
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },

  /**
   * Spacing System
   * Consistent spacing scale for margins, padding, gaps
   */
  spacing: {
    '0': '0px',
    '0.5': '0.125rem',  // 2px
    '1': '0.25rem',     // 4px
    '2': '0.5rem',      // 8px
    '3': '0.75rem',     // 12px
    '4': '1rem',        // 16px
    '5': '1.25rem',     // 20px
    '6': '1.5rem',      // 24px
    '8': '2rem',        // 32px
    '10': '2.5rem',     // 40px
    '12': '3rem',       // 48px
    '16': '4rem',       // 64px
    '20': '5rem',       // 80px
    '24': '6rem',       // 96px
  },

  /**
   * Border Radius
   * Consistent corner rounding
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.625rem',   // 10px (matches current --radius)
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  /**
   * Shadows
   * Elevation and depth system
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Custom Kroolo shadows
    dropdown: 'var(--dropdown-shadow)',
    popover: 'var(--popover-shadow)',
    select: 'var(--select-shadow)',
  },

  /**
   * Border Widths
   * Standard border thickness
   */
  borderWidth: {
    '0': '0px',
    '1': '1px',
    '2': '2px',
    '4': '4px',
    '8': '8px',
  },

  /**
   * Animation
   * Consistent timing and easing
   */
  animation: {
    duration: {
      instant: '50ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  /**
   * Z-Index Scale
   * Layering system for overlays, modals, etc.
   */
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  /**
   * Breakpoints
   * Responsive design breakpoints
   */
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /**
   * Component Presets
   * Pre-configured styles for common components
   */
  components: {
    card: {
      padding: '1rem',
      borderRadius: '0.625rem',
      border: '1px solid var(--border)',
      background: 'var(--card)',
    },
    button: {
      padding: '0.5rem 1.5rem',
      borderRadius: '0.5rem',
      fontSize: '13px',
      fontWeight: '500',
    },
    input: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '13px',
      border: '1px solid var(--border)',
      background: 'var(--input)',
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
    }
  }
} as const

/**
 * Type exports for TypeScript autocompletion
 */
export type ThemeConfig = typeof themeConfig
export type FontSize = keyof typeof themeConfig.typography.fontSize
export type FontWeight = keyof typeof themeConfig.typography.fontWeight
export type Spacing = keyof typeof themeConfig.spacing
export type BorderRadius = keyof typeof themeConfig.borderRadius
export type Shadow = keyof typeof themeConfig.shadows
export type AnimationDuration = keyof typeof themeConfig.animation.duration
export type Breakpoint = keyof typeof themeConfig.breakpoints

/**
 * Helper function to get theme values
 * Usage: getThemeValue('typography.fontSize.base') => '13px'
 */
export function getThemeValue(path: string): string {
  const keys = path.split('.')
  let value: any = themeConfig
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value as string
}

/**
 * Export default for convenience
 */
export default themeConfig
