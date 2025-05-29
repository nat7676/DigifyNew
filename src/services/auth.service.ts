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
        username: mobile, // The API uses 'username' field
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
    
    if (response.error) {
      const error = new Error(response.error)
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

    // Build AccessTokenInterface from response
    return {
      AccessToken: response.AccessToken,
      systemid: response.systemid,
      userid: response.userid,
      PortalID: response.PortalID,
      AccessLevelID: response.AccessLevelID,
      roles: response.roles || {},
      expire: response.expire,
      expiredate: response.expire ? new Date(response.expire) : new Date(),
      SessionID: response.SessionID
    }
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

    return {
      AccessToken: response.AccessToken,
      systemid: response.systemid,
      userid: response.userid,
      PortalID: response.PortalID,
      AccessLevelID: response.AccessLevelID,
      roles: response.roles || {},
      expire: response.expire,
      expiredate: response.expire ? new Date(response.expire) : new Date(),
      SessionID: response.SessionID
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

    return {
      AccessToken: response.AccessToken,
      systemid: response.systemid,
      userid: response.userid,
      PortalID: response.PortalID,
      AccessLevelID: response.AccessLevelID,
      roles: response.roles || {},
      expire: response.expire,
      expiredate: response.expire ? new Date(response.expire) : new Date(),
      SessionID: response.SessionID
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

    return {
      AccessToken: response.AccessToken,
      systemid: response.systemid,
      userid: response.userid,
      PortalID: response.PortalID,
      AccessLevelID: response.AccessLevelID,
      roles: response.roles || {},
      expire: response.expire,
      expiredate: response.expire ? new Date(response.expire) : new Date(),
      SessionID: response.SessionID
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

    return {
      AccessToken: response.AccessToken,
      systemid: response.systemid,
      userid: response.userid,
      PortalID: response.PortalID,
      AccessLevelID: response.AccessLevelID,
      roles: response.roles || {},
      expire: response.expire,
      expiredate: response.expire ? new Date(response.expire) : new Date(),
      SessionID: response.SessionID
    }
  }
}

export default new AuthService()