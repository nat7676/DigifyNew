/**
 * Authentication Store
 * Handles user authentication, token management, and session
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AccessTokenInterface, UserInfo } from '@/types/shared'
import { NodeEvent } from '@/modules/shared/shared'
import authService from '@/services/auth.service'
import socketService from '@/services/socket.service'

export const useAuthStore = defineStore('auth', () => {

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

  // Generate unique GUID
  function generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Computed
  const isAuthenticated = computed(() => {
    // Check if ANY valid token exists, not just for current system
    return Object.values(accessTokens.value).some(token => 
      token && token.expire > Date.now() / 1000
    )
  })

  const currentToken = computed(() => {
    // Return the token for current system, or the first valid token if none exists for current system
    const currentSysToken = accessTokens.value[currentSystemId.value]
    if (currentSysToken) return currentSysToken
    
    // If no token for current system, return the first valid token but with updated systemid
    const validToken = Object.values(accessTokens.value).find(token => 
      token && token.expire > Date.now() / 1000
    )
    
    if (validToken) {
      // Return a copy with the current system ID to prevent route guard issues
      return {
        ...validToken,
        systemid: currentSystemId.value
      }
    }
    
    return null
  })

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
  const setRedirectUrl = (url: string | null) => {
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

  const setToken = async (systemId: number, token: AccessTokenInterface, skipLoginInfo = false) => {
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
    
    // Skip logininfo call if requested (e.g., during system switch)
    if (skipLoginInfo) {
      console.log('Skipping logininfo call')
      return
    }
    
    // Fetch user data to get UniqueSystemKey
    try {
      const response = await socketService.sendRequest(NodeEvent.Api, {
        path: '/logininfo',
        data: {},
        settings: {}
      })
      
      console.log('logininfo response (login):', response)
      
      // The response has a different structure - it's in tables format
      if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
        const userData = response.ApiResp.tables[0].rows[0]
        console.log('User data (login):', userData)
        console.log('UniqueSystemKey (login):', userData.UniqueSystemKey)
        
        // Store the UniqueSystemKey in template service
        if (userData.UniqueSystemKey) {
          const { default: templateService } = await import('@/services/template.service')
          templateService.setSystemUniqueKey(userData.UniqueSystemKey)
          console.log('Stored UniqueSystemKey in template service (login)')
        } else {
          console.warn('No UniqueSystemKey found in user data (login)')
        }
        
        // Also store other user data if needed
        if (userData.UniqueUserKey) {
          console.log('UniqueUserKey:', userData.UniqueUserKey)
        }
      } else {
        console.warn('No user data returned from API (login)')
      }
    } catch (error) {
      console.error('Failed to fetch user data after login:', error)
    }
    
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
      
      // Update token in store (this will also fetch user data)
      await setToken(newToken.systemid, newToken)
      
      // Update socket authentication on ALL servers
      try {
        await socketService.sendRequest(NodeEvent.AccessToken, {
          AccessToken: newToken.AccessToken,
          LatestChatMsg: new Date(),
          SessionID: newToken.SessionID
        })
        console.log('✅ Refreshed AccessToken sent to all connected sockets')
      } catch (error) {
        console.error('Failed to send refreshed AccessToken to sockets:', error)
      }
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
      
      // Set token in store (this will also fetch user data)
      await setToken(token.systemid, token)

      // Send AccessToken to ALL socket servers for authentication
      // Note: The old system sends this with SpreadType.All to authenticate on all servers
      try {
        await socketService.sendRequest(NodeEvent.AccessToken, {
          AccessToken: token.AccessToken,
          LatestChatMsg: new Date(),
          SessionID: token.SessionID
        })
        console.log('✅ AccessToken sent to all connected sockets')
      } catch (error) {
        console.error('Failed to send AccessToken to sockets:', error)
        // Don't throw - authentication might still work on some servers
      }

      // Don't clear redirect URL here - let the router/component handle it
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
    console.log('🔄 switchSystem called with systemId:', systemId, 'current:', currentSystemId.value)
    
    // Check if we already have a valid token for this system
    const existingToken = accessTokens.value[systemId]
    if (existingToken && existingToken.expire > Date.now() / 1000) {
      // Token exists and is valid, just switch to it
      currentSystemId.value = systemId
      
      // Update user info from the token
      user.value = {
        userid: existingToken.userid,
        systemid: existingToken.systemid,
        PortalID: existingToken.PortalID,
        AccessLevelID: existingToken.AccessLevelID,
        roles: existingToken.roles,
        name: existingToken.userProfile?.Name || '',
        email: existingToken.userProfile?.Email || '',
        profileImage: existingToken.userProfile?.ProfileImage || ''
      }
      
      // Send AccessToken to all sockets for the new system
      try {
        await socketService.sendRequest(NodeEvent.AccessToken, {
          AccessToken: existingToken.AccessToken,
          LatestChatMsg: new Date(),
          SessionID: existingToken.SessionID
        })
        console.log('✅ Switched system - AccessToken sent to all connected sockets')
      } catch (error) {
        console.error('Failed to send AccessToken to sockets:', error)
      }
      
      // Fetch user data for the new system
      try {
        const response = await socketService.sendRequest(NodeEvent.Api, {
          path: '/logininfo',
          data: {},
          settings: {}
        })
        
        if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
          const userData = response.ApiResp.tables[0].rows[0]
          if (userData.UniqueSystemKey) {
            const { default: templateService } = await import('@/services/template.service')
            templateService.setSystemUniqueKey(userData.UniqueSystemKey)
            console.log('Updated UniqueSystemKey for system', systemId)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data for new system:', error)
      }
      
      return
    }
    
    // We need to get a new token for this system
    console.log('Need to fetch token for system:', systemId)
    
    try {
      // Call the setgroup API to switch systems
      console.log('📤 Calling setgroup API for system:', systemId)
      const response = await socketService.sendRequest(NodeEvent.Api, {
        path: `/Module/setgroup/${systemId}`,
        data: {},
        settings: {}
      })
      
      console.log('System switch response:', response)
      
      if (response.ApiResp?.tables?.[0]?.rows?.[0]?.AccessToken) {
        const tokenData = response.ApiResp.tables[0].rows[0]
        const accessTokenStr = tokenData.AccessToken
        const refreshToken = tokenData.RefreshToken
        
        // Import auth service to use proper token decoding
        const { default: authService } = await import('@/services/auth.service')
        
        // Use the proper decoding function from auth service
        const decodedToken = authService.decodeAccessToken(accessTokenStr)
        if (!decodedToken) {
          throw new Error('Failed to decode access token')
        }
        console.log('Decoded token:', decodedToken)
        
        // Create a new AccessTokenInterface object
        const newToken: AccessTokenInterface = {
          AccessToken: accessTokenStr,
          SessionID: decodedToken.SessionID || generateGuid(), // Use existing or generate new
          systemid: decodedToken.systemid,
          userid: decodedToken.userid,
          expire: decodedToken.expire,
          expiredate: decodedToken.expiredate,
          PortalID: decodedToken.PortalID,
          AccessLevelID: decodedToken.AccessLevelID,
          roles: decodedToken.roles || {},
          userProfile: currentToken.value?.userProfile ? {
            // Keep existing profile data but update with new token info
            ...currentToken.value.userProfile,
            RefreshToken: refreshToken
          } : undefined
        }
        
        // Store the new token (skip logininfo for now)
        await setToken(systemId, newToken, true)
        
        // Send the new AccessToken to all socket servers FIRST
        console.log('📤 Sending new AccessToken to websocket servers')
        try {
          await socketService.sendRequest(NodeEvent.AccessToken, {
            AccessToken: newToken.AccessToken,
            LatestChatMsg: new Date(),
            SessionID: newToken.SessionID
          })
          console.log('✅ New AccessToken sent to all connected sockets')
        } catch (error) {
          console.error('Failed to send new AccessToken to sockets:', error)
          // Don't throw - the switch was successful, just log the error
        }
        
        // Now fetch user data with the new system context
        try {
          const response = await socketService.sendRequest(NodeEvent.Api, {
            path: '/logininfo',
            data: {},
            settings: {}
          })
          
          if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
            const userData = response.ApiResp.tables[0].rows[0]
            console.log('User data after system switch:', userData)
            
            if (userData.UniqueSystemKey) {
              const { default: templateService } = await import('@/services/template.service')
              console.log('🔑 Setting new UniqueSystemKey:', userData.UniqueSystemKey, 'for system:', systemId)
              templateService.setSystemUniqueKey(userData.UniqueSystemKey)
              console.log('✅ Updated UniqueSystemKey for new system')
            } else {
              console.warn('⚠️ No UniqueSystemKey in userData for system:', systemId)
            }
            
            // Update user info with fresh data
            user.value = {
              userid: newToken.userid,
              systemid: newToken.systemid,
              PortalID: newToken.PortalID,
              AccessLevelID: newToken.AccessLevelID,
              roles: newToken.roles,
              name: userData.Name || newToken.userProfile?.Name || '',
              email: userData.Email || newToken.userProfile?.Email || '',
              profileImage: userData.ProfileImage || newToken.userProfile?.ProfileImage || ''
            }
          }
        } catch (error) {
          console.error('Failed to fetch user data after system switch:', error)
        }
        
        console.log('✅ Successfully switched to system:', systemId)
      } else {
        throw new Error('No access token returned from setgroup API')
      }
    } catch (error) {
      console.error('Failed to switch systems:', error)
      
      // Don't update currentSystemId on failure - this could cause confusion
      // The UI should handle the error and possibly redirect back
      throw error
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
    
    let firstValidToken: AccessTokenInterface | null = null
    
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
            firstValidToken = token
            
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

    // If we found a valid token, send it to all sockets after they connect
    if (firstValidToken && isAuthenticated.value) {
      console.log('Found valid token, will send to sockets when connected')
      
      // Create a function to send the token
      const sendStoredToken = async () => {
        // Check if socket is connected
        if (!socketService.isConnected.value) {
          console.log('Socket not connected yet, waiting...')
          return false
        }
        
        console.log('Sending stored AccessToken to all sockets...')
        try {
          await socketService.sendRequest(NodeEvent.AccessToken, {
            AccessToken: firstValidToken!.AccessToken,
            LatestChatMsg: new Date(),
            SessionID: firstValidToken!.SessionID
          })
          console.log('✅ Stored AccessToken sent to all connected sockets')
          
          // Also fetch user data to get UniqueSystemKey
          try {
            const response = await socketService.sendRequest(NodeEvent.Api, {
              path: '/logininfo',
              data: {},
              settings: {}
            })
            
            console.log('logininfo response:', response)
            
            // The response has a different structure - it's in tables format
            if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
              const userData = response.ApiResp.tables[0].rows[0]
              console.log('User data:', userData)
              console.log('UniqueSystemKey:', userData.UniqueSystemKey)
              
              // Store the UniqueSystemKey in template service
              if (userData.UniqueSystemKey) {
                const { default: templateService } = await import('@/services/template.service')
                templateService.setSystemUniqueKey(userData.UniqueSystemKey)
                console.log('Stored UniqueSystemKey in template service')
              } else {
                console.warn('No UniqueSystemKey found in user data')
              }
              
              // Also store other user data if needed
              if (userData.UniqueUserKey) {
                console.log('UniqueUserKey:', userData.UniqueUserKey)
              }
              
              // Second table contains system users
              if (response.ApiResp.tables[1]?.rows) {
                console.log('System users:', response.ApiResp.tables[1].rows)
              }
              
              // Third table contains settings
              if (response.ApiResp.tables[2]?.rows) {
                console.log('User settings:', response.ApiResp.tables[2].rows)
              }
            } else {
              console.warn('No user data returned from API')
            }
          } catch (error) {
            console.error('Failed to fetch user data during initialization:', error)
          }
          return true
        } catch (error) {
          console.error('Failed to send stored AccessToken to sockets:', error)
          return false
        }
      }
      
      // Try immediately if connected, otherwise retry
      let attempts = 0
      const maxAttempts = 10
      const tryToSend = async () => {
        if (await sendStoredToken()) {
          return // Success
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(tryToSend, 500) // Retry after 500ms
        } else {
          console.error('Failed to send AccessToken after', maxAttempts, 'attempts')
        }
      }
      
      // Start trying after a small delay
      setTimeout(tryToSend, 500)
    } else {
      console.log('No valid token found during initialization')
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
    currentSystemId: computed(() => currentSystemId.value),
    redirectUrl: computed(() => redirectUrl.value),

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