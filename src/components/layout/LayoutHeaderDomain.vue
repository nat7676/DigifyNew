<template>
  <v-dialog
    v-if="isLocalhost"
    v-model="menu"
    max-width="600"
    @update:model-value="handleMenuChange"
  >
    <template #activator="{ props }">
      <div
        v-bind="props"
        data-portal-selector
        class="d-none"
      />
    </template>

    <v-card class="portal-selector-card">
      <!-- Gradient Header -->
      <div class="portal-header">
        <div class="portal-header-content">
          <v-icon 
            size="40" 
            color="white"
            class="mb-2"
          >
            mdi-web
          </v-icon>
          <h2 class="text-h5 font-weight-bold text-white mb-1">
            Portal Selector
          </h2>
          <p class="text-body-2 text-white-70 mb-0">
            Debug Mode • Localhost Only
          </p>
        </div>
        
        <!-- Close button -->
        <v-btn
          icon
          variant="text"
          size="small"
          class="portal-close-btn"
          @click="menu = false"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </div>
      
      <!-- Current Portal Card -->
      <v-card-text class="pt-6">
        <v-card
          variant="tonal"
          color="primary"
          class="mb-6 current-portal-card"
        >
          <v-card-text class="d-flex align-center">
            <v-icon
              size="24"
              class="mr-3"
            >
              mdi-check-circle
            </v-icon>
            <div>
              <div class="text-overline">CURRENT PORTAL</div>
              <div class="text-h6 font-weight-bold">{{ currentDomain }}</div>
              <div class="text-caption opacity-70">Portal ID: {{ currentPortalId }}</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Search portals by name or domain..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          class="mb-4 search-field"
          :loading="loading"
        />

        <!-- Warning Alert -->
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          icon="mdi-alert"
        >
          <strong>Caution:</strong> Switching portals will clear your session and require re-authentication.
        </v-alert>
      </v-card-text>
      
      <!-- Portal List -->
      <v-divider />
      
      <div class="portal-list-container">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
          />
          <p class="text-body-1 mt-4 text-medium-emphasis">
            Loading available portals...
          </p>
        </div>
        
        <v-list
          v-else-if="filteredPortals.length > 0"
          class="portal-list"
        >
          <template
            v-for="(portal, index) in filteredPortals"
            :key="portal.PortalID"
          >
            <v-hover v-slot="{ isHovering, props: hoverProps }">
              <v-list-item
                v-bind="hoverProps"
                @click="selectPortal(portal)"
                class="portal-item"
                :class="{ 'portal-item-hover': isHovering }"
                :disabled="portal.Domain === currentDomain"
              >
                <template #prepend>
                  <v-avatar
                    :color="getPortalColor(portal.PortalID)"
                    size="40"
                    class="text-white font-weight-bold"
                  >
                    {{ portal.Name.charAt(0).toUpperCase() }}
                  </v-avatar>
                </template>
                
                <v-list-item-title class="font-weight-medium">
                  {{ portal.Name }}
                  <v-chip
                    v-if="portal.Domain === currentDomain"
                    size="x-small"
                    color="primary"
                    variant="flat"
                    class="ml-2"
                  >
                    ACTIVE
                  </v-chip>
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  <v-icon size="x-small" class="mr-1">mdi-web</v-icon>
                  {{ portal.Domain }}
                </v-list-item-subtitle>
                
                <template #append>
                  <v-icon
                    v-if="isHovering && portal.Domain !== currentDomain"
                    color="primary"
                  >
                    mdi-arrow-right
                  </v-icon>
                </template>
              </v-list-item>
            </v-hover>
            
            <v-divider 
              v-if="index < filteredPortals.length - 1"
              class="mx-4"
            />
          </template>
        </v-list>
        
        <div v-else class="text-center py-8">
          <v-icon
            size="64"
            color="grey-lighten-1"
            class="mb-4"
          >
            mdi-web-off
          </v-icon>
          <p class="text-h6 text-medium-emphasis">
            No portals found
          </p>
          <p class="text-body-2 text-medium-emphasis">
            {{ searchQuery ? 'Try adjusting your search criteria' : 'No portals available' }}
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-icon 
          size="small" 
          color="medium-emphasis"
          class="mr-2"
        >
          mdi-information-outline
        </v-icon>
        <span class="text-caption text-medium-emphasis">
          This feature is only available in development mode
        </span>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import sqlService from '@/services/sql.service'

interface PortalType {
  PortalID: number
  Name: string
  Domain?: string
}

const authStore = useAuthStore()
const uiStore = useUIStore()

// State
const menu = ref(false)
const loading = ref(false)
const portals = ref<PortalType[]>([])
const searchQuery = ref('')

// Computed
const isLocalhost = computed(() => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')
})

const currentDomain = computed(() => {
  return window.location.hostname
})

const currentPortalId = computed(() => {
  return authStore.currentToken?.PortalID || 1
})

const filteredPortals = computed(() => {
  if (!searchQuery.value) return portals.value
  
  const query = searchQuery.value.toLowerCase()
  return portals.value.filter(portal => 
    portal.Name.toLowerCase().includes(query) ||
    portal.Domain?.toLowerCase().includes(query)
  )
})

// Methods
const loadPortals = async () => {
  loading.value = true
  
  try {
    const response = await sqlService.executeSQLQueryWithCallback(
      '/Module/GetPortals',
      {},
      {}
    )
    
    if (response?.tables?.[0]?.rows) {
      const data = response.tables[0].rows as PortalType[]
      
      // Filter portals that have domains and sort by name
      const filtered = data
        .filter(d => d.Domain)
        .sort((a, b) => a.Name.localeCompare(b.Name))
      
      portals.value = filtered
    }
  } catch (error) {
    console.error('Failed to load portals:', error)
    uiStore.showError('Failed to load portals')
  } finally {
    loading.value = false
  }
}

const selectPortal = (portal: PortalType) => {
  if (portal.Domain) {
    // Clear all localStorage
    localStorage.clear()
    
    // Set the selected portal domain
    localStorage.setItem('useportal', portal.Domain)
    
    // Close menu
    menu.value = false
    
    // Logout and redirect
    authStore.logout().then(() => {
      window.location.href = '/'
    })
  }
}

const handleMenuChange = (value: boolean) => {
  if (value && portals.value.length === 0) {
    loadPortals()
  }
}

// Clear search when menu closes
watch(menu, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
  }
})

// Get color for portal avatar
const getPortalColor = (portalId: number) => {
  const colors = [
    'deep-purple',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'green',
    'orange',
    'deep-orange',
    'brown',
    'blue-grey'
  ]
  return colors[portalId % colors.length]
}
</script>

<style scoped>
.portal-selector-card {
  overflow: hidden;
  border-radius: 16px !important;
}

.portal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  text-align: center;
}

.portal-header-content {
  position: relative;
  z-index: 1;
}

.portal-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.text-white-70 {
  opacity: 0.85;
}

.current-portal-card {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.05) !important;
}

.search-field {
  transition: all 0.3s ease;
}

.search-field:hover {
  transform: translateY(-1px);
}

.portal-list-container {
  max-height: 400px;
  overflow-y: auto;
  background-color: rgba(var(--v-theme-surface), 0.02);
}

.portal-list {
  background: transparent !important;
}

.portal-item {
  padding: 16px 24px !important;
  transition: all 0.2s ease;
  cursor: pointer;
}

.portal-item:not(:disabled):hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  transform: translateX(4px);
}

.portal-item-hover:not(:disabled) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

.portal-item:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Custom scrollbar */
.portal-list-container::-webkit-scrollbar {
  width: 8px;
}

.portal-list-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.portal-list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.portal-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Animation for dialog entrance */
:deep(.v-overlay__content) {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .portal-header {
    padding: 1.5rem;
  }
  
  .portal-item {
    padding: 12px 16px !important;
  }
}
</style>