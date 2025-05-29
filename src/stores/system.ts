/**
 * System Store
 * Handles system configuration, domain settings, and global application state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DomainSettings, SystemInfo } from '@/types/shared'
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
    return systemInfo.value?.name || 'Digify'
  })

  // Methods
  const loadDomainSettings = async () => {
    // Get current domain
    const domain = window.location.hostname
    
    try {
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
    // TODO: Load system info from server based on currentSystemId
    systemInfo.value = {
      id: currentSystemId.value,
      name: 'Digify System',
      description: 'Default system',
      created: new Date().toISOString()
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

  const setServerUrl = (url: string) => {
    serverUrl.value = url
    localStorage.setItem('serverUrl', url)
  }

  const setOnlineStatus = (status: boolean) => {
    isOnline.value = status
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
    
    await loadSystemInfo()
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
    addAvailableSystem,
    setServerUrl,
    setOnlineStatus,
    initialize
  }
})