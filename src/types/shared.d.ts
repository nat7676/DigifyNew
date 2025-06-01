/**
 * Additional type definitions for shared module
 * These extend the types from the sacred shared.ts module
 */

import type { UserObjType } from '@/modules/shared/shared'

// AccessToken interface that combines server response with token
export interface AccessTokenInterface extends UserObjType {
  AccessToken: string
  PortalID: number
  userProfile?: {
    Tel: number
    Name: string
    Email: string
    FirstName: string
    ProfileImage?: string
    ActiveSystemID?: number
    RefreshToken?: string
  }
}

// User information interface
export interface UserInfo {
  userid: number
  systemid: number
  PortalID: number
  AccessLevelID: number
  roles: { [RoleID: number]: boolean }
  name: string
  email: string
  profileImage?: string
}

// Domain settings interface
export interface DomainSettings {
  DomainID: number
  DomainName: string
  DomainLogo?: string
  DomainColors?: string
  DomainFavicon?: string
  ShowToogleEditMode?: boolean
  DefaultPage?: string
  MenuType?: string
  SidebarSettings?: string
  CustomCSS?: string
  MenuItems?: string  // JSON string of menu items
}

// System information interface
export interface SystemInfo {
  id: number
  name: string
  description?: string
  created: string
  settings?: any
}

// Dashboard element interface
export interface DashboardElement {
  uniqueid: string
  element: string
  RunningStatus?: boolean
  Title?: string
  showHeader?: boolean
  padding?: string
  margin?: string
  CSS?: string
  MinimumAccessLevel?: number
  AccessRoles?: number[]
  HiddenModule?: boolean
  [key: string]: any // For module-specific properties
}