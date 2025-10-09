/**
 * Theme Module - Central Export
 * 
 * Import theme configuration and utilities from here:
 * import { themeConfig, getThemeValue } from '@/lib/theme'
 */

export { themeConfig, getThemeValue } from './theme.config'
export type {
  ThemeConfig,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
  AnimationDuration,
  Breakpoint
} from './theme.config'

export { default } from './theme.config'
