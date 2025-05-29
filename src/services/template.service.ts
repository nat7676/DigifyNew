/**
 * Template Service
 * Handles retrieval of templates, layouts, and portal settings from the server
 */

import socketService from './socket.service'
import { sha256 } from 'js-sha256'
import { NodeEvent } from '@/modules/shared/shared'
import type { 
  TemplateCacheType,
  TemplateCachePortal,
  TemplateCacheLayout
} from '@/modules/shared/shared'

interface TemplateCacheResponse {
  TemplateCachePortal?: TemplateCachePortal[]
  TemplateCacheLayout?: TemplateCacheLayout[]
}

// Cache storage
const templateCache = new Map<string, any>()
let portalUniqueKey: string | null = null
let systemUniqueKey: string | null = null

class TemplateService {
  /**
   * Get portal settings for a domain
   */
  async getPortalSettings(domain: string): Promise<TemplateCachePortal | null> {
    const cacheKey = `portal:${domain}`
    
    console.log('Getting portal settings for domain:', domain)
    
    // Check cache first
    if (templateCache.has(cacheKey)) {
      console.log('Found portal settings in cache')
      return templateCache.get(cacheKey)
    }

    try {
      const request: TemplateCacheType = {
        path: 'portal',
        domain: domain, // Portal requests need the domain
        uniqueKeys: []
      }
      
      console.log('Sending portal request:', request)
      
      const response = await socketService.sendRequest<any>(
        NodeEvent.TemplateCache,
        request
      )

      console.log('Full portal response:', response)
      
      // The actual data might be in response.TemplateCacheResp or response.TemplateCachePortal
      const templateData = response.TemplateCacheResp || response.TemplateCachePortal || response

      console.log('Template data:', templateData)

      // Handle both array and single object responses
      if (templateData) {
        let portal = null
        
        if (Array.isArray(templateData) && templateData.length > 0) {
          portal = templateData[0]
        } else if (typeof templateData === 'object' && !Array.isArray(templateData) && templateData.UniqueKey) {
          portal = templateData
        }
        
        if (portal) {
          templateCache.set(cacheKey, portal)
          
          // Store the portal unique key for layout requests
          portalUniqueKey = portal.UniqueKey
          console.log('Stored portal UniqueKey:', portalUniqueKey)
          console.log('Portal data:', portal)
          
          return portal
        }
      }
      
      console.log('No valid portal data found in response')
      
      // If localhost, try with a default domain
      if (domain === 'localhost' && !templateCache.has(cacheKey + ':tried-default')) {
        console.log('Trying with default domain for localhost...')
        templateCache.set(cacheKey + ':tried-default', true)
        return this.getPortalSettings('digify.no')
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
    useSystemKey?: string,
    objectId?: string
  ): Promise<any | null> {
    console.log('getDashboardLayout called with:', { layoutType, useSystemKey, objectId })
    console.log('Current portalUniqueKey:', portalUniqueKey)
    console.log('Current systemUniqueKey:', systemUniqueKey)
    
    // Generate unique keys for different layout levels
    const uniqueKeys: string[] = []
    
    // Global layout - use stored portal unique key
    if (portalUniqueKey) {
      const globalKey = sha256(portalUniqueKey + '_' + layoutType)
      uniqueKeys.push(globalKey)
      console.log('Added global key:', globalKey)
    }
    
    // System-specific layout
    if (useSystemKey || systemUniqueKey) {
      const sysKey = useSystemKey || systemUniqueKey || ''
      const systemLayoutKey = sha256(sysKey + '_' + layoutType)
      uniqueKeys.push(systemLayoutKey)
      console.log('Added system key:', systemLayoutKey)
    }
    
    // Object-specific layout
    if ((useSystemKey || systemUniqueKey) && objectId) {
      const sysKey = useSystemKey || systemUniqueKey || ''
      const objectKey = sha256(sysKey + '_' + layoutType + '_' + objectId)
      uniqueKeys.push(objectKey)
      console.log('Added object key:', objectKey)
    }
    
    console.log('Generated uniqueKeys:', uniqueKeys)

    try {
      const request: TemplateCacheType = {
        path: 'layout',
        domain: '', // Not needed for layouts
        uniqueKeys: uniqueKeys
      }
      
      const response = await socketService.sendRequest<any>(
        NodeEvent.TemplateCache,
        request
      )
      
      console.log('Layout response:', response)
      
      // The actual data might be in response.TemplateCacheResp
      const templateData = response.TemplateCacheResp || response

      if (templateData && Array.isArray(templateData) && templateData.length > 0) {
        // Return the most specific layout found (last in array)
        const layout = templateData[templateData.length - 1]
        
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
        uniqueKey = sha256(portalUniqueKey + '_' + layoutType)
        break
      case 'system':
        if (!systemUniqueKey) throw new Error('System unique key required for system level')
        uniqueKey = sha256(systemUniqueKey + '_' + layoutType)
        break
      case 'object':
        if (!systemUniqueKey || !objectId) {
          throw new Error('System unique key and object ID required for object level')
        }
        uniqueKey = sha256(systemUniqueKey + '_' + layoutType + '_' + objectId)
        break
    }

    // Store layout via API
    await socketService.sendRequest(NodeEvent.Api, {
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
    await socketService.sendRequest(NodeEvent.Api, {
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
    await socketService.sendRequest(NodeEvent.TemplateCacheReset, {})
    this.clearCache()
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    templateCache.clear()
  }

  /**
   * Set the system unique key for layout generation
   */
  setSystemUniqueKey(key: string): void {
    systemUniqueKey = key
  }

  /**
   * Get the current portal unique key
   */
  getPortalUniqueKey(): string | null {
    return portalUniqueKey
  }

  /**
   * Get the current system unique key
   */
  getSystemUniqueKey(): string | null {
    return systemUniqueKey
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