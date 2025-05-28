/**
 * Authentication Store
 * Handles user authentication, token management, and session
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Router } from 'vue-router'
import axios from 'axios'
import type { AccessTokenInterface, UserInfo } from '@/types/shared'
import { useSystemStore } from './system'

// Store the current systemId for token management
let currentSystemId = 0

// Router instance will be set during initialization
let router: Router | null = null

export const useAuthStore = defineStore('auth', () => {
  const systemStore = useSystemStore()

  // State
  const accessTokens = ref<{ [systemId: number]: AccessTokenInterface }>({})
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)
  const redirectUrl = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  const sessionTimeoutId = ref<number | null>(null)

  // Token refresh timer
  let tokenRefreshTimer: number | null = null

  // Computed
  const isAuthenticated = computed(() => {
    const token = accessTokens.value[currentSystemId]
    return !!token && token.expire > Date.now() / 1000
  })

  const currentToken = computed(() => accessTokens.value[currentSystemId])

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
    currentSystemId = systemId
    accessTokens.value[systemId] = token
    saveTokenToStorage(systemId, token)
    
    // Extract user info from token
    if (!user.value) {
      user.value = {
        userid: token.userid,
        systemid: token.systemid,
        PortalID: token.PortalID,
        AccessLevelID: token.AccessLevelID,
        roles: token.roles,
        name: '', // Will be populated from user profile
        email: '',
        profileImage: ''
      }
    }

    // Schedule token refresh
    scheduleTokenRefresh(token)

    // Configure axios default header
    if (axios.defaults.headers) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.AccessToken}`
    }
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

    // TODO: Implement actual token refresh API call
    // For now, just log
    console.log('Token refresh would happen here')
  }

  const login = async (mobile: string, password: string): Promise<void> => {
    loading.value = true
    try {
      // TODO: Implement actual login API call
      // For now, create a mock token
      const mockToken: AccessTokenInterface = {
        AccessToken: 'mock-token-' + Date.now(),
        systemid: 1,
        userid: parseInt(mobile),
        PortalID: 1,
        AccessLevelID: 100,
        roles: { 1: true, 2: true },
        expire: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        SessionID: 'session-' + Date.now()
      }

      setToken(1, mockToken)

      // Navigate to redirect URL or dashboard
      const destination = redirectUrl.value || '/dashboard'
      redirectUrl.value = null
      if (router) {
        await router.push(destination)
      }
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
    currentSystemId = 0

    // Clear timers
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer)
      tokenRefreshTimer = null
    }

    if (sessionTimeoutId.value) {
      clearTimeout(sessionTimeoutId.value)
      sessionTimeoutId.value = null
    }

    // Clear axios header
    if (axios.defaults.headers) {
      delete axios.defaults.headers.common['Authorization']
    }

    // Navigate to login
    if (router) {
      await router.push('/login')
    }
  }

  const switchSystem = async (systemId: number) => {
    currentSystemId = systemId
    const token = accessTokens.value[systemId]
    
    if (token) {
      // Configure axios header for new system
      if (axios.defaults.headers) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.AccessToken}`
      }
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

  const setRouterInstance = (routerInstance: Router) => {
    router = routerInstance
  }

  const initialize = async () => {
    // Load tokens from storage
    const systemIds = systemStore.availableSystemIds
    systemIds.forEach(systemId => {
      const token = loadTokenFromStorage(systemId)
      if (token) {
        setToken(systemId, token)
      }
    })

    // Set current system
    if (systemStore.currentSystemId && accessTokens.value[systemStore.currentSystemId]) {
      currentSystemId = systemStore.currentSystemId
    }

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
    setRouterInstance,
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