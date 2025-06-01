/**
 * Template Service
 * Handles retrieval of templates, layouts, and portal settings from the server
 */

import socketService from './socket.service'
import { sha256 } from 'js-sha256'
import { NodeEvent } from '@/modules/shared/shared'
import type { 
  TemplateCacheType,
  TemplateCachePortal
} from '@/modules/shared/shared'

// Remove unused interface - type is handled inline where needed

// Cache storage
const templateCache = new Map<string, any>()
let portalUniqueKey: string | null = null
let portalID: number | null = null
let systemUniqueKey: string | null = null

class TemplateService {
  /**
   * Get portal settings for a domain
   */
  async getPortalSettings(domain: string): Promise<TemplateCachePortal | null> {
    // For localhost development, use the configured development domain
    const actualDomain = domain === 'localhost' ? 'my.digify.no' : domain
    const cacheKey = `portal:${actualDomain}`
    
    // Check cache first
    if (templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey)
    }

    try {
      const request: TemplateCacheType = {
        path: 'portal',
        domain: actualDomain, // Use the actual domain, not localhost
        uniqueKeys: []
      }
      
      const response = await socketService.sendRequest<any>(
        NodeEvent.TemplateCache,
        request
      )

      // The portal data is returned directly in TemplateCacheResp
      const portal = response.TemplateCacheResp

      // Check if we have valid portal data
      if (portal && portal.UniqueKey && portal.PortalID) {
        // Store in cache
        templateCache.set(cacheKey, portal)
        
        // Store the portal unique key and ID for layout requests
        portalUniqueKey = portal.UniqueKey
        portalID = portal.PortalID
        
        return portal
      }
      
      // If no portal data found and we're in development, use development defaults
      if (!portal && import.meta.env.DEV) {
        const devPortal: TemplateCachePortal = {
          UniqueKey: 'dev_portal_unique_key',
          PortalID: 1,
          SettingsJson: JSON.stringify({
            DomainLogo: '/img/digify_favicon.png',
            DomainName: 'Development Portal',
            DomainColors: JSON.stringify({
              primary: '#1976D2',
              secondary: '#424242',
              accent: '#82B1FF'
            })
          }),
          CSS: ''
        }
        
        // Cache and store the dev portal settings
        templateCache.set(cacheKey, devPortal)
        portalUniqueKey = devPortal.UniqueKey
        portalID = devPortal.PortalID
        
        return devPortal
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
    
    // If a specific system key is provided, temporarily set it
    const originalSystemKey = systemUniqueKey
    if (useSystemKey) {
      systemUniqueKey = useSystemKey
    }
    
    // Generate unique keys using the same logic as the old system
    const uniqueKeys = this.getAllLayoutCacheKeys(layoutType, objectId)
    
    // Restore original system key if we temporarily changed it
    if (useSystemKey) {
      systemUniqueKey = originalSystemKey
    }
    

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
      
      
      // The layout data should be in response.TemplateCacheResp
      const layoutData = response.TemplateCacheResp

      // Layout responses can be an array of layouts (from most to least specific)
      if (layoutData) {
        if (Array.isArray(layoutData) && layoutData.length > 0) {
          // Return the first layout found with content (following old system behavior)
          // The server returns layouts matching our keys, and we want the first match
          // in our priority order (object-specific, then system-specific, then global)
          for (const layout of layoutData) {
            if (layout.Content) {
              try {
                return JSON.parse(layout.Content)
              } catch (error) {
                console.error('Failed to parse layout JSON:', error)
                // Continue to next layout if this one fails to parse
              }
            }
          }
          return null
        } else if (layoutData.Content) {
          // Single layout response
          try {
            return JSON.parse(layoutData.Content)
          } catch (error) {
            console.error('Failed to parse layout JSON:', error)
            return null
          }
        }
      }

      // If no layout found and we're in development, return a default layout
      if (uniqueKeys.length === 0 || (portalUniqueKey && portalUniqueKey.startsWith('dev_'))) {
        return {
          sections: [
            {
              id: 'welcome',
              title: 'Welcome to Insight Dashboard',
              columns: [
                {
                  width: 12,
                  elements: [
                    {
                      type: 'text',
                      content: 'This is a default development layout. Configure your portal settings to see the actual layout.'
                    }
                  ]
                }
              ]
            }
          ]
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
    const oldKey = systemUniqueKey
    systemUniqueKey = key
    // Emit event to notify components that system key has changed
    window.dispatchEvent(new CustomEvent('system-unique-key-changed', { 
      detail: { oldKey, newKey: key } 
    }))
  }

  /**
   * Get the current portal unique key
   */
  getPortalUniqueKey(): string | null {
    return portalUniqueKey
  }

  /**
   * Get the current portal ID
   */
  getPortalID(): number | null {
    return portalID
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
    // Use the same domain mapping as getPortalSettings
    const actualDomain = domain === 'localhost' ? 'my.digify.no' : domain
    const storageKey = `IL_${actualDomain}`
    
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
    const portal = await this.getPortalSettings(domain) // This will handle the domain mapping
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

  /**
   * Get all layout cache keys for a specific layout type
   * This matches the old system's getAllLayoutCacheKeys function
   */
  getAllLayoutCacheKeys(layoutType: string, objectId?: string): string[] {
    const keys: string[] = []
    
    // Map new layout types to old system layout types for compatibility
    const layoutTypeMap: { [key: string]: string } = {
      'insightDashboard': 'dashboard',
      'personaldashboard': 'personaldashboard',
      'company': 'company',
      'contract': 'contract',
      // Add more mappings as needed
    }
    
    // Use mapped layout type if available, otherwise use original
    const mappedLayoutType = layoutTypeMap[layoutType] || layoutType
    
    
    // Object-specific layout (most specific)
    if (systemUniqueKey && objectId) {
      const keyString = systemUniqueKey + '_' + mappedLayoutType + '_' + objectId
      const objectKey = sha256(keyString)
      keys.push(objectKey)
    }
    
    // System-specific layout
    if (systemUniqueKey) {
      const keyString = systemUniqueKey + '_' + mappedLayoutType
      const systemKey = sha256(keyString)
      keys.push(systemKey)
    }
    
    // Global layout (least specific)
    if (portalUniqueKey && portalID) {
      const keyString = portalUniqueKey + '_' + mappedLayoutType
      const globalKey = sha256(keyString)
      keys.push(globalKey)
    }
    
    
    return keys
  }
}

export default new TemplateService()