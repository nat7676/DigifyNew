/**
 * Authentication Service
 * Handles API calls for login, logout, and token management
 */

import http from './http.service'
import type { AccessTokenInterface } from '@/types/shared'

interface LoginResponse {
  token?: AccessTokenInterface
  error?: string
}

interface LoginRequest {
  ajax: string
  func: string
  [key: string]: any
}

class AuthService {
  /**
   * Login with mobile number and password
   */
  async login(mobile: string, password: string): Promise<AccessTokenInterface> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'login',
      email: mobile, // The API expects 'email' but we use mobile numbers
      password: password
    }

    const response = await http.ajax<LoginResponse>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.token) {
      throw new Error('No token received from server')
    }

    return response.token
  }

  /**
   * Send magic code to mobile number
   */
  async sendMagicCode(mobile: string): Promise<void> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'sendMagicCode',
      phone: mobile
    }

    const response = await http.ajax<{ success?: boolean; error?: string }>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
  }

  /**
   * Login with magic code
   */
  async loginWithMagicCode(mobile: string, code: string): Promise<AccessTokenInterface> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'loginWithMagicCode',
      phone: mobile,
      code: code
    }

    const response = await http.ajax<LoginResponse>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.token) {
      throw new Error('No token received from server')
    }

    return response.token
  }

  /**
   * Login with Microsoft account
   */
  async loginWithMicrosoft(msToken: string, account: { id: string; username: string; name: string }): Promise<AccessTokenInterface> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'microsoftLogin',
      msToken: msToken,
      account: account
    }

    const response = await http.ajax<LoginResponse>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.token) {
      throw new Error('No token received from server')
    }

    return response.token
  }

  /**
   * Refresh access token
   */
  async refreshToken(currentToken: string): Promise<AccessTokenInterface> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'refreshToken',
      token: currentToken
    }

    const response = await http.ajax<LoginResponse>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.token) {
      throw new Error('No token received from server')
    }

    return response.token
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<boolean> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'validateToken',
      token: token
    }

    const response = await http.ajax<{ valid: boolean }>(request)
    
    return response.valid || false
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<void> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'logout',
      token: token
    }

    await http.ajax(request)
  }

  /**
   * Switch system context
   */
  async switchSystem(systemId: number, token: string): Promise<AccessTokenInterface> {
    const request: LoginRequest = {
      ajax: 'AjaxLogin',
      func: 'switchSystem',
      systemId: systemId,
      token: token
    }

    const response = await http.ajax<LoginResponse>(request)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    if (!response.token) {
      throw new Error('No token received from server')
    }

    return response.token
  }
}

export default new AuthService()