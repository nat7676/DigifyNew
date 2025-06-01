<template>
  <div v-if="isLocalhost && isAuthenticated" class="debug-toolbar">
    <!-- Minimized state -->
    <v-btn
      v-if="!expanded"
      icon
      size="small"
      color="warning"
      class="debug-toggle"
      @click="expanded = true"
    >
      <v-icon>mdi-bug</v-icon>
    </v-btn>

    <!-- Expanded toolbar -->
    <v-card
      v-else
      class="debug-panel"
      elevation="8"
    >
      <v-card-title class="pa-2 d-flex align-center">
        <v-icon start size="small" color="warning">mdi-bug</v-icon>
        <span class="text-body-2">Debug Tools</span>
        <v-spacer />
        <v-btn
          icon
          size="x-small"
          variant="text"
          @click="expanded = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-2">
        <div class="d-flex flex-column gap-2">
          <!-- Portal Info -->
          <div class="debug-item">
            <v-btn
              size="small"
              variant="tonal"
              block
              @click="showPortalSelector"
            >
              <v-icon start size="small">mdi-link-box-outline</v-icon>
              Change Portal
            </v-btn>
          </div>

          <!-- Current Info -->
          <div class="text-caption text-medium-emphasis">
            <div>Portal: {{ currentPortalId }}</div>
            <div>System: {{ currentSystemId }}</div>
            <div>User: {{ currentUserId }}</div>
          </div>

          <!-- Additional debug actions -->

          <v-btn
            size="small"
            variant="tonal"
            block
            @click="clearCache"
          >
            <v-icon start size="small">mdi-cached</v-icon>
            Clear Cache
          </v-btn>

          <v-btn
            size="small"
            variant="tonal"
            block
            @click="showDebugInfo"
          >
            <v-icon start size="small">mdi-information</v-icon>
            Debug Info
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Debug Info Dialog -->
    <v-dialog
      v-model="debugDialog"
      max-width="800"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="warning">mdi-bug</v-icon>
          Debug Information
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="debugDialog = false"
          />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-4">
          <v-tabs v-model="debugTab">
            <v-tab value="general">General</v-tab>
            <v-tab value="auth">Auth</v-tab>
            <v-tab value="system">System</v-tab>
            <v-tab value="route">Route</v-tab>
            <v-tab value="storage">Storage</v-tab>
          </v-tabs>
          
          <v-window v-model="debugTab" class="mt-4">
            <v-window-item value="general">
              <pre class="debug-content">{{ JSON.stringify(generalDebugInfo, null, 2) }}</pre>
            </v-window-item>
            
            <v-window-item value="auth">
              <pre class="debug-content">{{ JSON.stringify(authDebugInfo, null, 2) }}</pre>
            </v-window-item>
            
            <v-window-item value="system">
              <pre class="debug-content">{{ JSON.stringify(systemDebugInfo, null, 2) }}</pre>
            </v-window-item>
            
            <v-window-item value="route">
              <pre class="debug-content">{{ JSON.stringify(routeDebugInfo, null, 2) }}</pre>
            </v-window-item>
            
            <v-window-item value="storage">
              <pre class="debug-content">{{ JSON.stringify(storageDebugInfo, null, 2) }}</pre>
            </v-window-item>
          </v-window>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions>
          <v-btn
            color="primary"
            variant="text"
            @click="copyDebugInfo"
          >
            <v-icon start>mdi-content-copy</v-icon>
            Copy All
          </v-btn>
          <v-spacer />
          <v-btn
            variant="text"
            @click="debugDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'
import templateService from '@/services/template.service'

const route = useRoute()
const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

// State
const expanded = ref(false)
const debugDialog = ref(false)
const debugTab = ref('general')

// Computed
const isLocalhost = computed(() => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentPortalId = computed(() => authStore.currentToken?.PortalID || 1)
const currentSystemId = computed(() => authStore.currentSystemId)
const currentUserId = computed(() => authStore.currentToken?.userid)

// Debug Info computed properties
const generalDebugInfo = computed(() => ({
  environment: {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    isDevelopment: import.meta.env.DEV,
    mode: import.meta.env.MODE
  },
  user: {
    userId: authStore.currentToken?.userid,
    systemId: authStore.currentSystemId,
    portalId: authStore.currentToken?.PortalID,
    accessLevel: authStore.currentToken?.AccessLevelID,
    roles: authStore.currentToken?.roles
  },
  timestamp: new Date().toISOString()
}))

const authDebugInfo = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  token: authStore.currentToken,
  user: authStore.user,
  availableSystems: authStore.availableSystems
}))

const systemDebugInfo = computed(() => ({
  currentSystemId: systemStore.currentSystemId,
  systemInfo: systemStore.systemInfo,
  domainSettings: systemStore.domainSettings,
  portalId: systemStore.portalId,
  serverUrl: systemStore.serverUrl,
  isOnline: systemStore.isOnline,
  systemName: systemStore.systemName,
  themeColors: systemStore.themeColors,
  templateService: {
    systemUniqueKey: templateService.getSystemUniqueKey(),
    portalUniqueKey: templateService.getPortalUniqueKey(),
    portalID: templateService.getPortalID()
  }
}))

const routeDebugInfo = computed(() => ({
  path: route.path,
  name: route.name,
  params: route.params,
  query: route.query,
  meta: route.meta,
  fullPath: route.fullPath
}))

const storageDebugInfo = computed(() => {
  const localStorage = {} as Record<string, any>
  const sessionStorage = {} as Record<string, any>
  
  // Get localStorage items
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key) {
      try {
        const value = window.localStorage.getItem(key)
        localStorage[key] = value?.startsWith('{') || value?.startsWith('[') 
          ? JSON.parse(value) 
          : value
      } catch {
        localStorage[key] = window.localStorage.getItem(key)
      }
    }
  }
  
  // Get sessionStorage items
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i)
    if (key) {
      try {
        const value = window.sessionStorage.getItem(key)
        sessionStorage[key] = value?.startsWith('{') || value?.startsWith('[') 
          ? JSON.parse(value) 
          : value
      } catch {
        sessionStorage[key] = window.sessionStorage.getItem(key)
      }
    }
  }
  
  return {
    localStorage,
    sessionStorage,
    usePortal: window.localStorage.getItem('useportal')
  }
})

// Methods
const showPortalSelector = () => {
  // Close the debug toolbar
  expanded.value = false
  
  // Trigger click on the portal selector button in the header
  const portalButton = document.querySelector('[data-portal-selector]')
  if (portalButton instanceof HTMLElement) {
    portalButton.click()
  } else {
    uiStore.showWarning('Portal selector not found in header')
  }
}

const clearCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  
  uiStore.showSuccess('Cache cleared. Reloading...')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

const showDebugInfo = () => {
  debugDialog.value = true
  expanded.value = false
}

const copyDebugInfo = async () => {
  const allDebugInfo = {
    general: generalDebugInfo.value,
    auth: authDebugInfo.value,
    system: systemDebugInfo.value,
    route: routeDebugInfo.value,
    storage: storageDebugInfo.value
  }
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(allDebugInfo, null, 2))
    uiStore.showSuccess('Debug info copied to clipboard')
  } catch (error) {
    console.error('Failed to copy debug info:', error)
    uiStore.showError('Failed to copy debug info')
  }
}
</script>

<style scoped>
.debug-toolbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.debug-toggle {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.debug-panel {
  width: 250px;
  max-width: 90vw;
}

.debug-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gap-2 {
  gap: 8px;
}

.debug-content {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.v-theme--dark) .debug-content {
  background-color: #1e1e1e;
}
</style>