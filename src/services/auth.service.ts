/**
 * Authentication Service
 * Handles API calls for login, logout, and token management
 * All communication goes through WebSocket (socket.io)
 */

import socketService from './socket.service'
import type { AccessTokenInterface } from '@/types/shared'
import { NodeEvent } from '@/modules/shared/shared'

interface LoginResponse {
  tables?: Array<{
    rows: Array<{
      AccessToken?: string
      systemid?: number
      userid?: number
      PortalID?: number
      AccessLevelID?: number
      roles?: { [RoleID: number]: boolean }
      expire?: number
      SessionID?: string
      error?: string
    }>
  }>
}

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
   * Execute API request through socket.io
   */
  private async executeApiRequest(request: ApiRequest): Promise<any> {
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
    
    throw new Error('Invalid response format')
  }

  /**
   * Login with mobile number and password
   */
  async login(mobile: string, password: string): Promise<AccessTokenInterface> {
    const response = await this.executeApiRequest({
      path: '/public/login/login',
      data: {
        username: mobile, // The API uses 'username' field
        password: password
      },
      settings: {
        sensitivecontent: true // Don't log passwords
      }
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.AccessToken) {
      throw new Error('No token received from server')
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
        mobile: mobile
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
        code: code
      }
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
        account: account
      }
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
      }
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
      }
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
      SessionID: response.SessionID
    }
  }
}

export default new AuthService()