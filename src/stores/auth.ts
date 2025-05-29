/**
 * Authentication Store
 * Handles user authentication, token management, and session
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AccessTokenInterface, UserInfo } from '@/types/shared'
import { useSystemStore } from './system'
import { NodeEvent } from '@/modules/shared/shared'
import authService from '@/services/auth.service'
import socketService from '@/services/socket.service'

export const useAuthStore = defineStore('auth', () => {
  const systemStore = useSystemStore()

  // State
  const accessTokens = ref<{ [systemId: number]: AccessTokenInterface }>({})
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)
  const redirectUrl = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const sessionTimeoutId = ref<number | null>(null)
  const currentSystemId = ref(0)

  // Token refresh timer
  let tokenRefreshTimer: number | null = null

  // Computed
  const isAuthenticated = computed(() => {
    const token = accessTokens.value[currentSystemId.value]
    return !!token && token.expire > Date.now() / 1000
  })

  const currentToken = computed(() => accessTokens.value[currentSystemId.value])

  const bearerToken = computed(() => {
    const token = currentToken.value
    return token ? `Bearer ${token.AccessToken}` : null
  })

  const userRoles = computed(() => {
    const token = currentToken.value
    return token?.roles || {}
  })

  const hasRole = (roleId: number): boolean => {
    return userRoles.value[roleId] === true
  }

  const hasAnyRole = (roleIds: number[]): boolean => {
    return roleIds.some(roleId => hasRole(roleId))
  }

  // Methods
  const setRedirectUrl = (url: string) => {
    redirectUrl.value = url
  }

  const saveTokenToStorage = (systemId: number, token: AccessTokenInterface) => {
    const key = `AccessTokenObj[${systemId}]`
    localStorage.setItem(key, JSON.stringify(token))
  }

  const loadTokenFromStorage = (systemId: number): AccessTokenInterface | null => {
    const key = `AccessTokenObj[${systemId}]`
    const stored = localStorage.getItem(key)
    if (!stored) return null

    try {
      const token = JSON.parse(stored) as AccessTokenInterface
      // Check if token is still valid
      if (token.expire > Date.now() / 1000) {
        return token
      }
      // Remove expired token
      localStorage.removeItem(key)
      return null
    } catch (error) {
      console.error('Failed to parse stored token:', error)
      localStorage.removeItem(key)
      return null
    }
  }

  const setToken = (systemId: number, token: AccessTokenInterface) => {
    console.log('Setting token for system:', systemId, token)
    currentSystemId.value = systemId
    accessTokens.value[systemId] = token
    saveTokenToStorage(systemId, token)
    
    // Store refresh token separately if available
    if (token.userProfile?.RefreshToken) {
      localStorage.setItem(`refreshToken_${systemId}`, token.userProfile.RefreshToken)
    }
    
    console.log('Current system ID:', currentSystemId.value)
    console.log('Is authenticated after token set:', isAuthenticated.value)
    
    // Extract user info from token and profile
    user.value = {
      userid: token.userid,
      systemid: token.systemid,
      PortalID: token.PortalID,
      AccessLevelID: token.AccessLevelID,
      roles: token.roles,
      name: token.userProfile?.Name || '',
      email: token.userProfile?.Email || '',
      profileImage: token.userProfile?.ProfileImage || ''
    }

    // Schedule token refresh
    scheduleTokenRefresh(token)
  }

  const scheduleTokenRefresh = (token: AccessTokenInterface) => {
    // Clear existing timer
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer)
    }

    // Calculate when to refresh (30 minutes before expiry)
    const expiryTime = token.expire * 1000
    const refreshTime = expiryTime - (30 * 60 * 1000)
    const timeUntilRefresh = refreshTime - Date.now()

    if (timeUntilRefresh > 0) {
      tokenRefreshTimer = setTimeout(async () => {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Token refresh failed:', error)
          // If refresh fails, logout user
          await logout()
        }
      }, timeUntilRefresh) as unknown as number
    }
  }

  const refreshToken = async () => {
    const token = currentToken.value
    if (!token) throw new Error('No token to refresh')

    try {
      // Get the refresh token
      const refreshTokenValue = localStorage.getItem(`refreshToken_${currentSystemId.value}`) || 
                               token.userProfile?.RefreshToken || 
                               token.AccessToken
      
      // Call refresh token API
      const newToken = await authService.refreshToken(refreshTokenValue)
      
      // Update token in store
      setToken(newToken.systemid, newToken)
      
      // Update socket authentication
      await socketService.sendRequest(NodeEvent.AccessToken, {
        AccessToken: newToken.AccessToken,
        LatestChatMsg: new Date(),
        SessionID: newToken.SessionID
      })
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  const login = async (mobile: string, password: string): Promise<void> => {
    loading.value = true
    try {
      // Call real login API
      const token = await authService.login(mobile, password)
      
      // Set token in store
      setToken(token.systemid, token)

      // Send AccessToken to all socket servers for authentication
      await socketService.sendRequest(NodeEvent.AccessToken, {
        AccessToken: token.AccessToken,
        LatestChatMsg: new Date(),
        SessionID: token.SessionID
      })

      // Clear any redirect URL
      redirectUrl.value = null
    } catch (error: any) {
      console.error('Login failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loginWithMicrosoft = async (): Promise<void> => {
    loading.value = true
    try {
      // TODO: Implement Microsoft SSO
      console.log('Microsoft SSO would happen here')
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    // Clear all tokens
    Object.keys(accessTokens.value).forEach(systemId => {
      const key = `AccessTokenObj[${systemId}]`
      localStorage.removeItem(key)
    })

    // Clear state
    accessTokens.value = {}
    user.value = null
    currentSystemId.value = 0

    // Clear timers
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer)
      tokenRefreshTimer = null
    }

    if (sessionTimeoutId.value) {
      clearTimeout(sessionTimeoutId.value)
      sessionTimeoutId.value = null
    }

    // Navigation to login should be handled by route guards or components
  }

  const switchSystem = async (systemId: number) => {
    currentSystemId.value = systemId
    const token = accessTokens.value[systemId]
    
    if (token) {
      // Socket service handles auth headers internally
    } else {
      // Need to get token for this system
      // TODO: Implement system switch API call
      console.log('Would fetch token for system:', systemId)
    }
  }

  const updateLastActivity = () => {
    lastActivity.value = Date.now()
  }

  const checkSessionTimeout = () => {
    const timeout = 30 * 60 * 1000 // 30 minutes
    const timeSinceActivity = Date.now() - lastActivity.value

    if (timeSinceActivity > timeout) {
      logout()
    } else {
      // Schedule next check
      if (sessionTimeoutId.value) {
        clearTimeout(sessionTimeoutId.value)
      }
      sessionTimeoutId.value = setTimeout(checkSessionTimeout, 60000) as unknown as number // Check every minute
    }
  }


  const initialize = async () => {
    // Try to load all tokens from localStorage by scanning for AccessTokenObj[*] keys
    const storageKeys = Object.keys(localStorage)
    const tokenKeys = storageKeys.filter(key => key.startsWith('AccessTokenObj['))
    
    tokenKeys.forEach(key => {
      const matches = key.match(/AccessTokenObj\[(\d+)\]/)
      if (matches && matches[1]) {
        const systemId = parseInt(matches[1])
        const token = loadTokenFromStorage(systemId)
        if (token) {
          // Don't use setToken here as it would trigger side effects
          accessTokens.value[systemId] = token
          
          // Set the first valid token's system as current
          if (!currentSystemId.value) {
            currentSystemId.value = systemId
            
            // Update user info from the token
            user.value = {
              userid: token.userid,
              systemid: token.systemid,
              PortalID: token.PortalID,
              AccessLevelID: token.AccessLevelID,
              roles: token.roles,
              name: token.userProfile?.Name || '',
              email: token.userProfile?.Email || '',
              profileImage: token.userProfile?.ProfileImage || ''
            }
          }
        }
      }
    })

    // Start session timeout monitoring
    checkSessionTimeout()

    // Listen for user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      document.addEventListener(event, updateLastActivity)
    })
  }

  return {
    // State
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    currentToken,
    bearerToken,
    userRoles,

    // Methods
    setRedirectUrl,
    hasRole,
    hasAnyRole,
    login,
    loginWithMicrosoft,
    logout,
    switchSystem,
    refreshToken,
    initialize
  }
})