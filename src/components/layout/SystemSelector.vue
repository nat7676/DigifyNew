<template>
  <v-dialog
    v-model="menu"
    max-width="600"
    @update:model-value="handleMenuChange"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="text-none system-selector-btn"
      >
        <v-avatar
          v-if="currentSystemImage"
          size="32"
          class="mr-2"
        >
          <v-img
            :src="currentSystemImage"
            :alt="currentSystemName"
            cover
          />
        </v-avatar>
        <v-icon
          v-else
          size="24"
          class="mr-2"
        >
          mdi-domain
        </v-icon>
        
        <div class="text-left mr-1">
          <div class="text-body-2 font-weight-medium">{{ currentSystemName }}</div>
          <div class="text-caption text-medium-emphasis">System {{ currentSystemId }}</div>
        </div>
        
        <v-icon size="20">mdi-chevron-down</v-icon>
      </v-btn>
    </template>

    <v-card class="system-selector-card">
      <!-- Gradient Header -->
      <div class="system-header">
        <div class="system-header-content">
          <v-icon 
            size="40" 
            color="white"
            class="mb-2"
          >
            mdi-swap-horizontal
          </v-icon>
          <h2 class="text-h5 font-weight-bold text-white mb-1">
            System Selector
          </h2>
          <p class="text-body-2 text-white-70 mb-0">
            Switch between your available systems
          </p>
        </div>
        
        <!-- Close button -->
        <v-btn
          icon
          variant="text"
          size="small"
          class="system-close-btn"
          @click="menu = false"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </div>
      
      <!-- Current System Card -->
      <v-card-text class="pt-6">
        <v-card
          variant="tonal"
          color="success"
          class="mb-6 current-system-card"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar
              v-if="currentSystem?.ProfileImage"
              size="48"
              class="mr-3 system-logo"
            >
              <v-img
                :src="currentSystem.ProfileImage"
                :alt="currentSystem.Name"
                cover
              />
            </v-avatar>
            <v-icon
              v-else
              size="28"
              class="mr-3"
            >
              mdi-check-circle
            </v-icon>
            <div class="flex-grow-1">
              <div class="text-overline">ACTIVE SYSTEM</div>
              <div class="text-h6 font-weight-bold">{{ currentSystemName }}</div>
              <div class="text-caption opacity-70">
                System ID: {{ currentSystemId }}
                <span v-if="currentSystem?.rID"> • Record: {{ currentSystem.rID }}</span>
              </div>
            </div>
            <v-chip
              v-if="systemsWithAccess.length > 0"
              size="small"
              color="success"
              variant="flat"
            >
              {{ currentUserRole }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Search -->
        <v-text-field
          v-if="systemsWithAccess.length > 5"
          v-model="searchQuery"
          placeholder="Search systems by name..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          class="mb-4 search-field"
          :loading="loading"
        />

        <!-- Info Alert -->
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          icon="mdi-information"
        >
          You have access to {{ systemsWithAccess.length }} {{ systemsWithAccess.length === 1 ? 'system' : 'systems' }}. 
          Switching will update your workspace context.
        </v-alert>
      </v-card-text>
      
      <!-- System List -->
      <v-divider />
      
      <div class="system-list-container">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
          />
          <p class="text-body-1 mt-4 text-medium-emphasis">
            Loading your systems...
          </p>
        </div>
        
        <v-list
          v-else-if="filteredSystems.length > 0"
          class="system-list"
        >
          <template
            v-for="(system, index) in filteredSystems"
            :key="system.SystemID"
          >
            <v-hover v-slot="{ isHovering, props: hoverProps }">
              <v-list-item
                v-bind="hoverProps"
                @click="switchToSystem(system.SystemID)"
                class="system-item"
                :class="{ 
                  'system-item-hover': isHovering,
                  'system-item-active': system.SystemID === currentSystemId
                }"
                :disabled="system.SystemID === currentSystemId"
              >
                <template #prepend>
                  <v-avatar
                    v-if="system.ProfileImage"
                    size="40"
                    class="system-avatar"
                  >
                    <v-img
                      :src="system.ProfileImage"
                      :alt="system.Name"
                      cover
                    />
                  </v-avatar>
                  <v-avatar
                    v-else
                    :color="getSystemColor(system.SystemID)"
                    size="40"
                    class="text-white font-weight-bold"
                  >
                    {{ getSystemInitials(system.Name || `System ${system.SystemID}`) }}
                  </v-avatar>
                </template>
                
                <v-list-item-title class="font-weight-medium">
                  {{ system.Name || `System ${system.SystemID}` }}
                  <v-chip
                    v-if="system.SystemID === currentSystemId"
                    size="x-small"
                    color="success"
                    variant="flat"
                    class="ml-2"
                  >
                    ACTIVE
                  </v-chip>
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  <v-icon size="x-small" class="mr-1">mdi-identifier</v-icon>
                  System ID: {{ system.SystemID }}
                  <span v-if="system.Created" class="ml-2">
                    <v-icon size="x-small" class="mr-1">mdi-calendar</v-icon>
                    {{ formatDate(system.Created) }}
                  </span>
                </v-list-item-subtitle>
                
                <template #append>
                  <div class="d-flex align-center">
                    <v-chip
                      v-if="system.hasAccess"
                      size="x-small"
                      variant="tonal"
                      class="mr-2"
                    >
                      Access
                    </v-chip>
                    <v-icon
                      v-if="isHovering && system.SystemID !== currentSystemId"
                      color="primary"
                    >
                      mdi-arrow-right
                    </v-icon>
                  </div>
                </template>
              </v-list-item>
            </v-hover>
            
            <v-divider 
              v-if="index < filteredSystems.length - 1"
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
            mdi-domain-off
          </v-icon>
          <p class="text-h6 text-medium-emphasis">
            No systems found
          </p>
          <p class="text-body-2 text-medium-emphasis">
            {{ searchQuery ? 'Try adjusting your search criteria' : 'No systems available' }}
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
          mdi-shield-check
        </v-icon>
        <span class="text-caption text-medium-emphasis">
          Your access is managed by system administrators
        </span>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'
import socketService from '@/services/socket.service'
import { NodeEvent } from '@/modules/shared/shared'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

interface System {
  SystemID: number
  Name?: string
  ProfileImage?: string
  hasAccess: boolean
  Created?: string
  rID?: number
}

// State
const menu = ref(false)
const loading = ref(false)
const searchQuery = ref('')
const availableSystems = ref<System[]>([])

const systemsWithAccess = computed(() => {
  return availableSystems.value.filter(system => system.hasAccess)
})

// Computed
const currentSystemId = computed(() => authStore.currentSystemId || systemStore.currentSystemId)
const currentSystemName = computed(() => systemStore.currentSystemName || systemStore.systemName || `System ${currentSystemId.value}`)
const currentSystemImage = computed(() => {
  const currentSystem = availableSystems.value.find(s => s.SystemID === currentSystemId.value)
  return currentSystem?.ProfileImage
})

const currentSystem = computed(() => {
  return availableSystems.value.find(s => s.SystemID === currentSystemId.value)
})

const currentUserRole = computed(() => {
  // You can expand this to show actual role from auth store
  return 'Admin'
})

const filteredSystems = computed(() => {
  if (!searchQuery.value) {
    return systemsWithAccess.value
  }
  
  const search = searchQuery.value.toLowerCase()
  return systemsWithAccess.value.filter(system => {
    const name = system.Name || `System ${system.SystemID}`
    return name.toLowerCase().includes(search) || 
           system.SystemID.toString().includes(search)
  })
})

// Helper functions
const getSystemColor = (systemId: number): string => {
  const colors = [
    'primary',
    'secondary',
    'success',
    'info',
    'warning',
    'error',
    'deep-purple',
    'indigo',
    'teal',
    'orange'
  ]
  return colors[systemId % colors.length]
}

const getSystemInitials = (name: string): string => {
  const words = name.split(' ')
  if (words.length >= 2) {
    return words[0][0].toUpperCase() + words[1][0].toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Load available systems
const loadAvailableSystems = async () => {
  loading.value = true
  
  try {
    const response = await socketService.sendRequest(NodeEvent.Api, {
      path: '/cache/nodecustomer/CompanyUserCache/AllSystems',
      data: {},
      settings: {}
    })
    
    if (response.ApiResp?.tables?.[0]?.rows) {
      availableSystems.value = response.ApiResp.tables[0].rows
    }
  } catch (error) {
    console.error('Failed to load available systems:', error)
    uiStore.showError('Failed to load available systems')
  } finally {
    loading.value = false
  }
}

// Switch to a different system
const switchToSystem = async (systemId: number) => {
  if (systemId === currentSystemId.value) {
    menu.value = false
    return
  }
  
  try {
    // Update the system in auth store
    await authStore.switchSystem(systemId)
    
    // Update the system store
    await systemStore.setCurrentSystemId(systemId)
    
    // Close the menu
    menu.value = false
    
    // Navigate to the same route with new context ID
    await router.push({
      path: route.path,
      query: {
        ...route.query,
        contextId: systemId
      }
    })
    
    // Show success message
    const selectedSystem = availableSystems.value.find(s => s.SystemID === systemId)
    uiStore.showSuccess(`Switched to ${selectedSystem?.Name || `System ${systemId}`}`)
    
    // Emit event for other components to react
    window.dispatchEvent(new CustomEvent('system-switched', { 
      detail: { 
        oldSystemId: currentSystemId.value, 
        newSystemId: systemId 
      } 
    }))
  } catch (error) {
    console.error('Failed to switch system:', error)
    uiStore.showError('Failed to switch system')
  }
}

// Handle menu state changes
const handleMenuChange = (value: boolean) => {
  if (value) {
    // Reset search when opening
    searchQuery.value = ''
    // Reload systems when opening
    loadAvailableSystems()
  }
}

// Lifecycle
onMounted(() => {
  // Load systems if we have a current system
  if (currentSystemId.value) {
    loadAvailableSystems()
  }
})
</script>

<style scoped>
/* Button Styles */
.system-selector-btn {
  height: 48px !important;
  padding: 0 12px !important;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.system-selector-btn:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

/* Card Styles */
.system-selector-card {
  overflow: hidden;
  border-radius: 16px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
}

/* Gradient Header */
.system-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%);
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
}

.system-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.system-header-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.system-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

/* Current System Card */
.current-system-card {
  border: 2px solid rgba(var(--v-theme-success), 0.3);
  background: rgba(var(--v-theme-success), 0.05) !important;
  transition: all 0.3s ease;
}

.current-system-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.2);
}

/* Search Field */
.search-field :deep(.v-field) {
  border-radius: 12px;
}

.search-field :deep(.v-field__input) {
  padding-top: 12px;
  padding-bottom: 12px;
}

/* System List Container */
.system-list-container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom Scrollbar */
.system-list-container::-webkit-scrollbar {
  width: 8px;
}

.system-list-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.system-list-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
  transition: background 0.2s;
}

.system-list-container::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* System List */
.system-list {
  padding: 0 !important;
}

/* System Item */
.system-item {
  padding: 16px 24px !important;
  min-height: 72px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.system-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: transparent;
  transition: all 0.3s ease;
}

.system-item-hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.system-item-hover::before {
  background: rgb(var(--v-theme-primary));
}

.system-item-active {
  background-color: rgba(var(--v-theme-success), 0.08) !important;
  cursor: default !important;
}

.system-item-active::before {
  background: rgb(var(--v-theme-success)) !important;
}

/* System Avatar */
.system-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.system-item-hover .system-avatar {
  transform: scale(1.05);
}

/* Logo Animation */
.system-logo {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Text Styles */
.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}

/* Transitions */
.v-dialog {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive */
@media (max-width: 600px) {
  .system-header {
    padding: 24px 16px;
  }
  
  .system-item {
    padding: 12px 16px !important;
  }
  
  .system-list-container {
    max-height: 300px;
  }
}
</style>