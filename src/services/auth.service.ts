/**
 * Authentication Service
 * Handles API calls for login, logout, and token management
 * All communication goes through WebSocket (socket.io)
 */

import socketService from './socket.service'
import type { AccessTokenInterface } from '@/types/shared'
import { NodeEvent } from '@/modules/shared/shared'
import { getDomain } from '@/utils/domain'
import { v4 as uuidv4 } from 'uuid'

// LoginResponse interface commented out - using direct response handling

interface ApiRequest {
  path: string
  data: any
  settings: {
    sensitivecontent?: boolean
    array?: boolean
    cacheuser?: boolean
    cachesystem?: boolean
  }
}

class AuthService {
  /**
   * Get or create a session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('SessionID')
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem('SessionID', sessionId)
    }
    return sessionId as string
  }

  /**
   * Decode the AccessToken to extract user information
   * The token is base64 encoded JSON with a 32-character hash at the end
   */
  decodeAccessToken(accessToken: string): Omit<AccessTokenInterface, 'AccessToken' | 'userProfile'> | null {
    try {
      // Decode base64
      const decoded = atob(accessToken)
      
      // Remove the 32-character hash at the end
      const json = decoded.substring(0, decoded.length - 32)
      
      // Parse JSON array and get first element
      const tokenArray = JSON.parse(json)
      if (!Array.isArray(tokenArray) || tokenArray.length === 0) {
        return null
      }
      
      const tokenData = tokenArray[0]
      
      // Convert expire timestamp to Date
      return {
        systemid: tokenData.systemid,
        userid: tokenData.userid,
        PortalID: tokenData.PortalID,
        AccessLevelID: tokenData.AccessLevelID,
        roles: tokenData.roles || {},
        expire: tokenData.expire,
        expiredate: new Date(tokenData.expire * 1000), // Convert seconds to milliseconds
        SessionID: tokenData.rid || ''
      }
    } catch (error) {
      console.error('Failed to decode AccessToken:', error)
      return null
    }
  }
  /**
   * Execute API request through socket.io
   */
  private async executeApiRequest(request: ApiRequest): Promise<any> {
    try {
      const response = await socketService.sendRequest<any>(
        NodeEvent.Api,
        request
      )
      
      // Handle the SQL response format
      if (response.ApiResp?.tables && response.ApiResp.tables.length > 0) {
        const firstTable = response.ApiResp.tables[0]
        if (firstTable.rows && firstTable.rows.length > 0) {
          return firstTable.rows[0]
        }
      }
      
      // Include full response in error for debugging
      const error = new Error('Invalid response format')
      ;(error as any).response = response
      ;(error as any).request = request
      throw error
    } catch (error: any) {
      // Enhance error with request details
      error.request = request
      throw error
    }
  }

  /**
   * Login with mobile number and password
   */
  async login(mobile: string, password: string): Promise<AccessTokenInterface> {
    const loginRequest = {
      path: '/public/login/login',
      data: {
        mobile: mobile,
        password: password,
        domain: getDomain(),
        contextId: 0, // Will be updated from system store when available
        SessionID: this.getOrCreateSessionId(),
        UserAgent: navigator.userAgent
      },
      settings: {
        sensitivecontent: true // Don't log passwords
      }
    }
    
    const response = await this.executeApiRequest(loginRequest)
    
    // Check for error in response
    if (response.error) {
      const error = new Error(response.error)
      ;(error as any).response = response
      ;(error as any).request = loginRequest
      throw error
    }
    
    // Check StatusID
    if (response.StatusID && response.StatusID !== 200) {
      const error = new Error(response.StatusDescription || 'Login failed')
      ;(error as any).response = response
      ;(error as any).request = loginRequest
      throw error
    }
    
    if (!response.AccessToken) {
      const error = new Error('No token received from server')
      ;(error as any).response = response
      ;(error as any).request = loginRequest
      throw error
    }

    // Decode the AccessToken to get the token data
    const tokenData = this.decodeAccessToken(response.AccessToken)
    
    if (!tokenData) {
      const error = new Error('Invalid token format')
      ;(error as any).response = response
      ;(error as any).request = loginRequest
      throw error
    }

    // Build AccessTokenInterface from decoded token and add additional user info
    const result = {
      ...tokenData,
      AccessToken: response.AccessToken,
      // Add user profile information from response
      userProfile: {
        Tel: response.Tel,
        Name: response.Name,
        Email: response.Email,
        FirstName: response.FirstName,
        ProfileImage: response.ProfileImage,
        ActiveSystemID: response.ActiveSystemID,
        RefreshToken: response.RefreshToken
      }
    }
    
    return result
  }

  /**
   * Send magic code to mobile number
   */
  async sendMagicCode(mobile: string): Promise<void> {
    const response = await this.executeApiRequest({
      path: '/public/magicalcode',
      data: {
        mobile: mobile,
        domain: getDomain()
      },
      settings: {}
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
  }

  /**
   * Login with magic code
   */
  async loginWithMagicCode(mobile: string, code: string): Promise<AccessTokenInterface> {
    const response = await this.executeApiRequest({
      path: '/Cloud/customer/loginnew/loginWithMagicCode',
      data: {
        mobile: mobile,
        code: code,
        domain: getDomain(),
        contextId: 0,
        SessionID: this.getOrCreateSessionId(),
        UserAgent: navigator.userAgent
      },
      settings: {}
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.AccessToken) {
      throw new Error('No token received from server')
    }

    // Decode the AccessToken to get the token data
    const tokenData = this.decodeAccessToken(response.AccessToken)
    
    if (!tokenData) {
      throw new Error('Invalid token format')
    }

    // Build AccessTokenInterface from decoded token and add additional user info
    return {
      ...tokenData,
      AccessToken: response.AccessToken,
      userProfile: {
        Tel: response.Tel,
        Name: response.Name,
        Email: response.Email,
        FirstName: response.FirstName,
        ProfileImage: response.ProfileImage,
        ActiveSystemID: response.ActiveSystemID,
        RefreshToken: response.RefreshToken
      }
    }
  }

  /**
   * Login with Microsoft account
   */
  async loginWithMicrosoft(msToken: string, account: { id: string; username: string; name: string }): Promise<AccessTokenInterface> {
    const response = await this.executeApiRequest({
      path: '/Cloud/customer/loginnew/microsoftLogin',
      data: {
        msToken: msToken,
        account: account,
        domain: getDomain(),
        contextId: 0,
        SessionID: this.getOrCreateSessionId(),
        UserAgent: navigator.userAgent
      },
      settings: {}
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.AccessToken) {
      throw new Error('No token received from server')
    }

    // Decode the AccessToken to get the token data
    const tokenData = this.decodeAccessToken(response.AccessToken)
    
    if (!tokenData) {
      throw new Error('Invalid token format')
    }

    // Build AccessTokenInterface from decoded token and add additional user info
    return {
      ...tokenData,
      AccessToken: response.AccessToken,
      userProfile: {
        Tel: response.Tel,
        Name: response.Name,
        Email: response.Email,
        FirstName: response.FirstName,
        ProfileImage: response.ProfileImage,
        ActiveSystemID: response.ActiveSystemID,
        RefreshToken: response.RefreshToken
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(currentToken: string): Promise<AccessTokenInterface> {
    const response = await this.executeApiRequest({
      path: '/public/getAccessTokenFromRefreshTokenNew',
      data: {
        refreshToken: currentToken
      },
      settings: {}
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.AccessToken) {
      throw new Error('No token received from server')
    }

    // Decode the AccessToken to get the token data
    const tokenData = this.decodeAccessToken(response.AccessToken)
    
    if (!tokenData) {
      throw new Error('Invalid token format')
    }

    // Build AccessTokenInterface from decoded token and add additional user info
    return {
      ...tokenData,
      AccessToken: response.AccessToken,
      userProfile: {
        Tel: response.Tel,
        Name: response.Name,
        Email: response.Email,
        FirstName: response.FirstName,
        ProfileImage: response.ProfileImage,
        ActiveSystemID: response.ActiveSystemID,
        RefreshToken: response.RefreshToken
      }
    }
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<boolean> {
    const response = await this.executeApiRequest({
      path: '/Cloud/customer/loginnew/validateToken',
      data: {
        token: token
      },
      settings: {}
    })
    
    return response.valid || false
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<void> {
    await this.executeApiRequest({
      path: '/Cloud/customer/user/logout',
      data: {
        token: token
      },
      settings: {}
    })
  }

  /**
   * Switch system context
   */
  async switchSystem(systemId: number, token: string): Promise<AccessTokenInterface> {
    const response = await this.executeApiRequest({
      path: '/Cloud/customer/loginnew/switchSystem',
      data: {
        systemId: systemId,
        token: token
      },
      settings: {}
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.AccessToken) {
      throw new Error('No token received from server')
    }

    // Decode the AccessToken to get the token data
    const tokenData = this.decodeAccessToken(response.AccessToken)
    
    if (!tokenData) {
      throw new Error('Invalid token format')
    }

    // Build AccessTokenInterface from decoded token and add additional user info
    return {
      ...tokenData,
      AccessToken: response.AccessToken,
      userProfile: {
        Tel: response.Tel,
        Name: response.Name,
        Email: response.Email,
        FirstName: response.FirstName,
        ProfileImage: response.ProfileImage,
        ActiveSystemID: response.ActiveSystemID,
        RefreshToken: response.RefreshToken
      }
    }
  }
}

export default new AuthService()