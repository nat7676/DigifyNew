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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'

const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

// State
const expanded = ref(false)

// Computed
const isLocalhost = computed(() => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentPortalId = computed(() => authStore.currentToken?.PortalID || 1)
const currentSystemId = computed(() => authStore.currentSystemId)
const currentUserId = computed(() => authStore.currentToken?.userid)

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
  const debugInfo = {
    token: authStore.currentToken,
    systemInfo: systemStore.systemInfo,
    portalId: systemStore.portalId,
    isOnline: systemStore.isOnline,
    serverUrl: systemStore.serverUrl,
    usePortal: localStorage.getItem('useportal')
  }
  
  console.log('Debug Info:', debugInfo)
  uiStore.showSnackbar('Debug info logged to console')
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
</style>