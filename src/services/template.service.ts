/**
 * Template Service
 * Handles retrieval of templates, layouts, and portal settings from the server
 */

import socketService from './socket.service'
import { sha256 } from 'js-sha256'
import type { NodeEvent } from '@/modules/shared/shared'

interface TemplateCacheRequest {
  path: string
  domain: string
  uniqueKeys: string[]
}

interface TemplateCachePortal {
  UniqueKey: string
  SettingsJson: string
  PortalID: number
  CSS: string
}

interface TemplateCacheLayout {
  UniqueKey: string
  Content: string
}

interface TemplateCacheResponse {
  TemplateCachePortal?: TemplateCachePortal[]
  TemplateCacheLayout?: TemplateCacheLayout[]
}

// Cache storage
const templateCache = new Map<string, any>()

class TemplateService {
  /**
   * Get portal settings for a domain
   */
  async getPortalSettings(domain: string): Promise<TemplateCachePortal | null> {
    const cacheKey = `portal:${domain}`
    
    // Check cache first
    if (templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey)
    }

    try {
      const response = await socketService.sendRequest<TemplateCacheResponse>(
        'TemplateCache' as NodeEvent,
        {
          path: 'portal',
          domain: domain,
          uniqueKeys: []
        }
      )

      if (response.TemplateCachePortal && response.TemplateCachePortal.length > 0) {
        const portal = response.TemplateCachePortal[0]
        templateCache.set(cacheKey, portal)
        return portal
      }

      return null
    } catch (error) {
      console.error('Failed to get portal settings:', error)
      return null
    }
  }

  /**
   * Get dashboard layout
   */
  async getDashboardLayout(
    layoutType: string,
    portalUniqueKey: string,
    systemUniqueKey?: string,
    objectId?: string
  ): Promise<any | null> {
    // Generate unique keys for different layout levels
    const uniqueKeys: string[] = []
    
    // Global layout
    uniqueKeys.push(sha256(portalUniqueKey + layoutType))
    
    // System-specific layout
    if (systemUniqueKey) {
      uniqueKeys.push(sha256(systemUniqueKey + layoutType))
    }
    
    // Object-specific layout
    if (systemUniqueKey && objectId) {
      uniqueKeys.push(sha256(systemUniqueKey + layoutType + objectId))
    }

    try {
      const response = await socketService.sendRequest<TemplateCacheResponse>(
        'TemplateCache' as NodeEvent,
        {
          path: 'layout',
          domain: '', // Not needed for layouts
          uniqueKeys: uniqueKeys
        }
      )

      if (response.TemplateCacheLayout && response.TemplateCacheLayout.length > 0) {
        // Return the most specific layout found (last in array)
        const layout = response.TemplateCacheLayout[response.TemplateCacheLayout.length - 1]
        
        try {
          return JSON.parse(layout.Content)
        } catch (error) {
          console.error('Failed to parse layout JSON:', error)
          return null
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get dashboard layout:', error)
      return null
    }
  }

  /**
   * Save dashboard layout
   */
  async saveDashboardLayout(
    layoutType: string,
    content: any,
    level: 'global' | 'system' | 'object',
    portalUniqueKey: string,
    systemUniqueKey?: string,
    objectId?: string
  ): Promise<void> {
    // Generate unique key based on level
    let uniqueKey: string
    
    switch (level) {
      case 'global':
        uniqueKey = sha256(portalUniqueKey + layoutType)
        break
      case 'system':
        if (!systemUniqueKey) throw new Error('System unique key required for system level')
        uniqueKey = sha256(systemUniqueKey + layoutType)
        break
      case 'object':
        if (!systemUniqueKey || !objectId) {
          throw new Error('System unique key and object ID required for object level')
        }
        uniqueKey = sha256(systemUniqueKey + layoutType + objectId)
        break
    }

    // Store layout via API
    await socketService.sendRequest('Api' as NodeEvent, {
      path: '/Module/Layout/Store',
      data: {
        uniqueKey: uniqueKey,
        content: JSON.stringify(content),
        layoutType: layoutType,
        level: level
      }
    })

    // Clear cache
    this.clearCache()
  }

  /**
   * Save portal settings
   */
  async savePortalSettings(domain: string, settings: any): Promise<void> {
    await socketService.sendRequest('Api' as NodeEvent, {
      path: '/Module/portal/save',
      data: {
        domain: domain,
        settings: JSON.stringify(settings)
      }
    })

    // Clear cache
    const cacheKey = `portal:${domain}`
    templateCache.delete(cacheKey)
  }

  /**
   * Reset template cache on server
   */
  async resetTemplateCache(): Promise<void> {
    await socketService.sendRequest('TemplateCacheReset' as NodeEvent, {})
    this.clearCache()
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    templateCache.clear()
  }

  /**
   * Load domain settings from localStorage with server fallback
   */
  async loadDomainSettings(domain: string): Promise<any> {
    const storageKey = `IL_${domain}`
    
    // Try localStorage first
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse stored domain settings:', error)
      }
    }

    // Fallback to server
    const portal = await this.getPortalSettings(domain)
    if (portal) {
      try {
        const settings = JSON.parse(portal.SettingsJson)
        // Save to localStorage
        localStorage.setItem(storageKey, portal.SettingsJson)
        return settings
      } catch (error) {
        console.error('Failed to parse portal settings:', error)
      }
    }

    return null
  }
}

export default new TemplateService()