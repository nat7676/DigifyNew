/**
 * System Store
 * Handles system configuration, domain settings, and global application state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DomainSettings, SystemInfo } from '@/types/shared'
import { NodeEvent } from '@/modules/shared/shared'
import templateService from '@/services/template.service'

export const useSystemStore = defineStore('system', () => {
  // State
  const currentSystemId = ref<number>(1) // Default system
  const availableSystemIds = ref<number[]>([1]) // Systems user has access to
  const domainSettings = ref<DomainSettings | null>(null)
  const systemInfo = ref<SystemInfo | null>(null)
  const serverUrl = ref('https://data.digify.no')
  const portalId = ref<number>(1)
  const isOnline = ref(true)
  const maintenanceMode = ref(false)
  const menuItems = ref<any[]>([]) // Custom menu items from server
  const currentSystemName = ref<string | null>(null) // Actual system name from logininfo

  // Computed
  const isDevelopment = computed(() => import.meta.env.DEV)
  const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')

  const themeColors = computed(() => {
    if (!domainSettings.value?.DomainColors) {
      return {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#82B1FF'
      }
    }

    try {
      const colors = JSON.parse(domainSettings.value.DomainColors)
      return colors
    } catch {
      return {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#82B1FF'
      }
    }
  })

  const logoUrl = computed(() => {
    return domainSettings.value?.DomainLogo || '/img/digify_favicon.png'
  })

  const systemName = computed(() => {
    // Use the actual system name from logininfo if available
    return currentSystemName.value || systemInfo.value?.name || 'Digify'
  })

  // Methods
  const loadDomainSettings = async () => {
    // Get current domain
    const domain = window.location.hostname
    
    try {
      // First, ensure portal settings are loaded (this sets the portal unique key)
      const portalSettings = await templateService.getPortalSettings(domain)
      if (portalSettings) {
        // Store the portal ID from the portal settings
        portalId.value = portalSettings.PortalID
      }
      
      // Try to load from template service (localStorage with server fallback)
      const settings = await templateService.loadDomainSettings(domain)
      if (settings) {
        domainSettings.value = settings
        // Also save to our local storage key
        localStorage.setItem('DomainSettings', JSON.stringify(settings))
      }
    } catch (error) {
      console.error('Failed to load domain settings:', error)
      
      // Fallback to old localStorage key
      const stored = localStorage.getItem('DomainSettings')
      if (stored) {
        try {
          domainSettings.value = JSON.parse(stored)
        } catch (parseError) {
          console.error('Failed to parse stored domain settings:', parseError)
        }
      }
    }
  }

  const saveDomainSettings = (settings: DomainSettings) => {
    domainSettings.value = settings
    localStorage.setItem('DomainSettings', JSON.stringify(settings))
  }

  const loadSystemInfo = async () => {
    try {
      // Load all systems the user has access to
      const { default: socketService } = await import('@/services/socket.service')
      const response = await socketService.sendRequest(NodeEvent.Api, {
        path: '/Module/CompanyUserCache',
        data: {
          type: 'AllSystems'
        },
        settings: {}
      })
      
      if (response.ApiResp?.tables?.[0]?.rows) {
        const systems = response.ApiResp.tables[0].rows
        
        // Find the current system
        const currentSystem = systems.find((sys: any) => sys.SystemID === currentSystemId.value)
        
        if (currentSystem) {
          systemInfo.value = {
            id: currentSystem.SystemID,
            name: currentSystem.Name || `System ${currentSystem.SystemID}`,
            description: currentSystem.Description || '',
            created: currentSystem.Created || new Date().toISOString(),
            profileImage: currentSystem.ProfileImage,
            rID: currentSystem.rID
          }
        } else {
          // Fallback if system not found
          systemInfo.value = {
            id: currentSystemId.value,
            name: `System ${currentSystemId.value}`,
            description: 'System information not available',
            created: new Date().toISOString()
          }
        }
        
        // Store all available systems for future use
        availableSystemIds.value = systems.map((sys: any) => sys.SystemID)
      }
    } catch (error) {
      console.error('Failed to load system info:', error)
      // Use fallback values
      systemInfo.value = {
        id: currentSystemId.value,
        name: `System ${currentSystemId.value}`,
        description: 'Default system',
        created: new Date().toISOString()
      }
    }
  }

  const switchSystem = async (systemId: number) => {
    if (availableSystemIds.value.includes(systemId)) {
      currentSystemId.value = systemId
      localStorage.setItem('currentSystemId', systemId.toString())
      await loadSystemInfo()
      // Trigger system switch in other stores
    }
  }

  const addAvailableSystem = (systemId: number) => {
    if (!availableSystemIds.value.includes(systemId)) {
      availableSystemIds.value.push(systemId)
    }
  }

  const setCurrentSystemId = async (systemId: number) => {
    currentSystemId.value = systemId
    // Also add to available systems if not already there
    addAvailableSystem(systemId)
    // Load system info for the new system
    await loadSystemInfo()
    // Load the actual system name from logininfo
    await loadSystemNameFromLoginInfo()
  }

  const setServerUrl = (url: string) => {
    serverUrl.value = url
    localStorage.setItem('serverUrl', url)
  }

  const setOnlineStatus = (status: boolean) => {
    isOnline.value = status
  }
  
  const setMenuItems = (items: any[]) => {
    menuItems.value = items
  }

  const loadSystemNameFromLoginInfo = async () => {
    try {
      const { default: socketService } = await import('@/services/socket.service')
      const response = await socketService.sendRequest(NodeEvent.Api, {
        path: '/logininfo',
        data: {},
        settings: {}
      })
      
      if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
        const userData = response.ApiResp.tables[0].rows[0]
        if (userData.SystemName) {
          currentSystemName.value = userData.SystemName
        }
      }
    } catch (error) {
      console.error('Failed to load system name from logininfo:', error)
    }
  }

  const initialize = async () => {
    // Load saved values
    const savedSystemId = localStorage.getItem('currentSystemId')
    if (savedSystemId) {
      currentSystemId.value = parseInt(savedSystemId)
    }

    const savedServerUrl = localStorage.getItem('serverUrl')
    if (savedServerUrl) {
      serverUrl.value = savedServerUrl
    }

    // Monitor online status
    window.addEventListener('online', () => setOnlineStatus(true))
    window.addEventListener('offline', () => setOnlineStatus(false))

    // Load settings with error handling
    // Don't wait for domain settings from server during initialization
    loadDomainSettings().catch(error => {
      console.warn('Domain settings will load when socket connects:', error.message)
    })
    
    // Load system info after we have the current system ID
    loadSystemInfo().catch(error => {
      console.warn('System info will load when socket connects:', error.message)
    })
    
    // Load system name from logininfo
    loadSystemNameFromLoginInfo().catch(error => {
      console.warn('System name will load when socket connects:', error.message)
    })
  }

  return {
    // State
    currentSystemId: computed(() => currentSystemId.value),
    availableSystemIds: computed(() => availableSystemIds.value),
    domainSettings: computed(() => domainSettings.value),
    systemInfo: computed(() => systemInfo.value),
    serverUrl: computed(() => serverUrl.value),
    portalId: computed(() => portalId.value),
    isOnline: computed(() => isOnline.value),
    maintenanceMode: computed(() => maintenanceMode.value),
    menuItems: computed(() => menuItems.value),
    
    // Computed
    isDevelopment,
    appVersion,
    themeColors,
    logoUrl,
    systemName,
    
    // Methods
    loadDomainSettings,
    saveDomainSettings,
    loadSystemInfo,
    switchSystem,
    setCurrentSystemId,
    addAvailableSystem,
    setServerUrl,
    setOnlineStatus,
    setMenuItems,
    loadSystemNameFromLoginInfo,
    initialize
  }
})