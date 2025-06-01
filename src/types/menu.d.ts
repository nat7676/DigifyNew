/**
 * Menu Types
 * Defines the structure for dynamic menu items
 */

import type { Setting } from '@/modules/shared/shared'

export interface MenuItem {
  title?: string  // Made optional for dividers
  url?: string
  icon?: string
  iconcolor?: string
  children?: MenuItem[]
  Visible?: Setting | null  // Which setting controls visibility
  divider?: boolean
  click?: () => void | Promise<void>  // For dynamic actions
  badge?: string | number
  badgeColor?: string
  group?: string  // For grouping menu items
  exact?: boolean  // For exact route matching
}

export interface MenuConfig {
  items: MenuItem[]
  collapsed?: boolean
  mini?: boolean
}