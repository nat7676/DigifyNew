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
import { getDomain } from '@/utils/domain'

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
    // Use getDomain() to ensure consistent domain mapping
    const actualDomain = domain === 'localhost' || domain === 'localhost.digify.no' 
      ? getDomain() // This will respect useportal localStorage
      : domain
    const cacheKey = `portal:${actualDomain}`
    
    console.log('getPortalSettings called:', { 
      domain, 
      actualDomain, 
      cacheKey,
      useportal: localStorage.getItem('useportal')
    })
    
    // Check cache first
    if (templateCache.has(cacheKey)) {
      const cached = templateCache.get(cacheKey)
      console.log('Portal settings from cache:', { 
        domain: actualDomain, 
        UniqueKey: cached.UniqueKey,
        PortalID: cached.PortalID 
      })
      return cached
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
        const oldPortalKey = portalUniqueKey
        portalUniqueKey = portal.UniqueKey
        portalID = portal.PortalID
        
        console.log('Portal settings loaded:', {
          domain: actualDomain,
          portalUniqueKey: portal.UniqueKey,
          portalID: portal.PortalID,
          previousPortalKey: oldPortalKey,
          changed: oldPortalKey !== portal.UniqueKey
        })
        
        // If portal key changed, clear all cached layouts
        if (oldPortalKey && oldPortalKey !== portal.UniqueKey) {
          console.log('Portal key changed, clearing all cached layouts')
          // Clear layout cache but keep portal cache
          const portalEntries = new Map()
          templateCache.forEach((value, key) => {
            if (key.startsWith('portal:')) {
              portalEntries.set(key, value)
            }
          })
          templateCache.clear()
          portalEntries.forEach((value, key) => templateCache.set(key, value))
        }
        
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
    console.log('getDashboardLayout:', { 
      layoutType, 
      objectId, 
      uniqueKeys, 
      systemUniqueKey, 
      portalUniqueKey,
      portalID,
      domain: window.location.hostname,
      actualDomain: getDomain(),
      useportal: localStorage.getItem('useportal')
    })
    
    // Restore original system key if we temporarily changed it
    if (useSystemKey) {
      systemUniqueKey = originalSystemKey
    }
    

    // If no keys generated (no portal or system loaded yet), return not found layout
    if (uniqueKeys.length === 0) {
      console.log('No unique keys generated, returning DashboardNotFound layout')
      return {
        Desktop: [
          {
            uniqueid: 'section-not-found-1',
            col: [
              {
                uniqueid: 'col-not-found-1',
                md: 12,
                elements: [
                  {
                    uniqueid: 'dashboard-not-found-1',
                    element: 'DashboardNotFound',
                    layoutType: layoutType,
                    contextId: objectId,
                    systemKey: systemUniqueKey,
                    portalKey: portalUniqueKey,
                    message: 'Portal settings not loaded yet'
                  }
                ]
              }
            ]
          }
        ]
      }
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

      // If no layout found, return a beautiful "not found" layout with paradigmatic gravitas
      console.log('No layout found, returning DashboardNotFound layout')
      return {
        Desktop: [
          {
            uniqueid: 'section-not-found-2',
            col: [
              {
                uniqueid: 'col-not-found-2',
                md: 12,
                elements: [
                  {
                    uniqueid: 'dashboard-not-found-2',
                    element: 'DashboardNotFound',
                    layoutType: layoutType,
                    contextId: objectId,
                    systemKey: systemUniqueKey,
                    portalKey: portalUniqueKey
                  }
                ]
              }
            ]
          }
        ]
      }
    } catch (error) {
      console.error('Failed to get dashboard layout:', error)
      
      // Return the "not found" layout even on error
      return {
        Desktop: [
          {
            uniqueid: 'section-not-found-3',
            col: [
              {
                uniqueid: 'col-not-found-3',
                md: 12,
                elements: [
                  {
                    uniqueid: 'dashboard-not-found-3',
                    element: 'DashboardNotFound',
                    layoutType: layoutType,
                    contextId: objectId,
                    systemKey: systemUniqueKey,
                    portalKey: portalUniqueKey,
                    error: (error as Error).message || 'Failed to load dashboard layout'
                  }
                ]
              }
            ]
          }
        ]
      }
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
        // For localhost, include domain to ensure portal isolation
        const isLocalhost = window.location.hostname === 'localhost'
        const currentDomain = getDomain()
        uniqueKey = sha256(
          isLocalhost 
            ? currentDomain + '_' + systemUniqueKey + '_' + layoutType
            : systemUniqueKey + '_' + layoutType
        )
        break
      case 'object':
        if (!systemUniqueKey || !objectId) {
          throw new Error('System unique key and object ID required for object level')
        }
        // For localhost, include domain to ensure portal isolation
        const isLocalhost2 = window.location.hostname === 'localhost'
        const currentDomain2 = getDomain()
        uniqueKey = sha256(
          isLocalhost2
            ? currentDomain2 + '_' + systemUniqueKey + '_' + layoutType + '_' + objectId
            : systemUniqueKey + '_' + layoutType + '_' + objectId
        )
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
   * Clear portal-specific data (useful when switching domains)
   */
  clearPortalData(): void {
    console.log('Clearing portal data and ALL cache entries')
    portalUniqueKey = null
    portalID = null
    // Clear ALL cache entries when switching portals
    // This is important because layout cache keys depend on portal context
    templateCache.clear()
  }
  
  /**
   * Force reload portal settings (useful when useportal changes)
   */
  async reloadPortalSettings(): Promise<TemplateCachePortal | null> {
    // Clear all cached data
    this.clearPortalData()
    
    // Get the current domain (respecting useportal)
    const domain = getDomain()
    console.log('Reloading portal settings for domain:', domain)
    
    // Load fresh portal settings
    return this.getPortalSettings(domain)
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
   * Check if portal is initialized
   */
  isPortalInitialized(): boolean {
    return portalUniqueKey !== null && portalID !== null
  }

  /**
   * Force portal reinitialization - useful when switching portals
   */
  async reinitializePortal(): Promise<void> {
    // Clear all portal-related data
    this.clearPortalData()
    
    // Get the current domain (will respect useportal)
    const domain = getDomain()
    
    // Reload portal settings
    await this.getPortalSettings(domain)
  }

  /**
   * Load domain settings from localStorage with server fallback
   */
  async loadDomainSettings(domain: string): Promise<any> {
    // Use getDomain() to ensure consistent domain mapping
    const actualDomain = domain === 'localhost' || domain === 'localhost.digify.no'
      ? getDomain() // This will respect useportal localStorage
      : domain
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
    
    
    // IMPORTANT: For localhost with useportal, we need to ensure proper isolation
    // by including the current domain in the cache key generation
    const currentDomain = getDomain()
    const isLocalhost = window.location.hostname === 'localhost'
    
    // Object-specific layout (most specific)
    if (systemUniqueKey && objectId) {
      // For localhost, include domain to ensure portal isolation
      const keyString = isLocalhost 
        ? currentDomain + '_' + systemUniqueKey + '_' + mappedLayoutType + '_' + objectId
        : systemUniqueKey + '_' + mappedLayoutType + '_' + objectId
      const objectKey = sha256(keyString)
      keys.push(objectKey)
      console.log('Object-specific key:', { keyString, objectKey, domain: currentDomain })
    }
    
    // System-specific layout
    if (systemUniqueKey) {
      // For localhost, include domain to ensure portal isolation
      const keyString = isLocalhost
        ? currentDomain + '_' + systemUniqueKey + '_' + mappedLayoutType
        : systemUniqueKey + '_' + mappedLayoutType
      const systemKey = sha256(keyString)
      keys.push(systemKey)
      console.log('System-specific key:', { keyString, systemKey, domain: currentDomain })
    }
    
    // Portal-specific layout (global for the portal)
    if (portalUniqueKey && portalID) {
      const keyString = portalUniqueKey + '_' + mappedLayoutType
      const globalKey = sha256(keyString)
      keys.push(globalKey)
      console.log('Portal-specific key:', { keyString, globalKey, domain: currentDomain })
    }
    
    
    return keys
  }
}

export default new TemplateService()