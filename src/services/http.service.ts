/**
 * HTTP Service
 * Wraps axios with authentication, error handling, and queue management
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useSystemStore } from '@/stores/system'

// Create axios instance
const httpClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request queue for pre-auth requests
interface QueuedRequest {
  config: AxiosRequestConfig
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

let requestQueue: QueuedRequest[] = []
let isRefreshing = false

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const systemStore = useSystemStore()

    // Set base URL from system store
    config.baseURL = systemStore.serverUrl

    // Add bearer token if available
    const token = authStore.bearerToken
    if (token && config.headers) {
      config.headers.Authorization = token
    }

    // Add system context if available
    if (authStore.currentToken && config.params) {
      config.params.contextId = authStore.currentToken.systemid
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    // Convert date strings to Date objects
    convertDates(response.data)
    return response
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true
        originalRequest._retry = true

        try {
          await authStore.refreshToken()
          isRefreshing = false

          // Process queued requests
          requestQueue.forEach(({ config, resolve, reject }) => {
            httpClient.request(config).then(resolve).catch(reject)
          })
          requestQueue = []

          // Retry original request
          return httpClient.request(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          requestQueue = []
          
          // Refresh failed, logout user
          await authStore.logout()
          uiStore.showError('Session expired. Please login again.')
          return Promise.reject(refreshError)
        }
      } else {
        // Token is being refreshed, queue this request
        return new Promise((resolve, reject) => {
          requestQueue.push({ config: originalRequest, resolve, reject })
        })
      }
    }

    // Handle other errors
    handleHttpError(error)
    return Promise.reject(error)
  }
)

// Error handler
function handleHttpError(error: AxiosError) {
  const uiStore = useUIStore()
  
  if (error.response) {
    // Server responded with error
    const status = error.response.status
    const data = error.response.data as any

    switch (status) {
      case 400:
        uiStore.showError(data?.message || 'Bad request')
        break
      case 403:
        uiStore.showError('Access denied')
        break
      case 404:
        uiStore.showError('Resource not found')
        break
      case 429:
        uiStore.showError('Too many requests. Please try again later.')
        break
      case 500:
        uiStore.showError('Server error. Please try again later.')
        break
      default:
        uiStore.showError(data?.message || 'An error occurred')
    }
  } else if (error.request) {
    // Request made but no response
    uiStore.showError('Network error. Please check your connection.')
  } else {
    // Request setup error
    uiStore.showError('Request failed. Please try again.')
  }

  // Log error for debugging
  console.error('HTTP Error:', error)
}

// Date conversion helper
function convertDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (obj instanceof Array) {
    return obj.map(convertDates)
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        // Check if value is a date string
        if (typeof value === 'string' && isDateString(value)) {
          obj[key] = new Date(value)
        } else if (typeof value === 'object') {
          obj[key] = convertDates(value)
        }
      }
    }
  }

  return obj
}

// Check if string is a date
function isDateString(value: string): boolean {
  // ISO 8601 date format
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  
  if (iso8601Regex.test(value)) {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  
  return false
}

// HTTP methods
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    httpClient.get<T>(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    httpClient.post<T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    httpClient.put<T>(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    httpClient.delete<T>(url, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    httpClient.patch<T>(url, data, config),

  // Special method for AJAX calls (legacy compatibility)
  ajax: async <T = any>(params: any): Promise<T> => {
    const response = await httpClient.post<T>('/ajax', params)
    return response.data
  }
}

export default http