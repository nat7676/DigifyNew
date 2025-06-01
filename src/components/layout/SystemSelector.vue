<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom"
    min-width="300"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="text-none"
        append-icon="mdi-chevron-down"
      >
        <div class="text-left">
          <div class="text-body-2 font-weight-medium">{{ currentSystemName }}</div>
          <div class="text-caption text-medium-emphasis">System ID: {{ currentSystemId }}</div>
        </div>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="text-h6">
        Select System
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-0">
        <v-list
          v-if="!loading"
          density="comfortable"
          max-height="400"
          class="overflow-y-auto"
        >
          <v-list-item
            v-for="system in systemsWithAccess"
            :key="system.SystemID"
            :active="system.SystemID === currentSystemId"
            @click="switchToSystem(system.SystemID)"
          >
            <template #prepend>
              <v-avatar size="40">
                <v-img
                  v-if="system.ProfileImage"
                  :src="system.ProfileImage"
                  :alt="system.Name"
                />
                <v-icon v-else color="grey">mdi-domain</v-icon>
              </v-avatar>
            </template>
            
            <v-list-item-title>{{ system.Name || `System ${system.SystemID}` }}</v-list-item-title>
            <v-list-item-subtitle>ID: {{ system.SystemID }}</v-list-item-subtitle>
            
            <template #append>
              <v-icon
                v-if="system.SystemID === currentSystemId"
                color="primary"
              >
                mdi-check
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
          />
          <p class="text-body-2 mt-2">Loading systems...</p>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="menu = false"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
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
  Name: string
  ProfileImage: string
  hasAccess: boolean
}

// State
const menu = ref(false)
const loading = ref(false)
const availableSystems = ref<System[]>([])

const systemsWithAccess = computed(() => {
  return availableSystems.value.filter(system => system.hasAccess)
})

// Computed
const currentSystemId = computed(() => authStore.currentSystemId || systemStore.currentSystemId)
const currentSystemName = computed(() => systemStore.systemName)

// Load available systems
const loadAvailableSystems = async () => {
  loading.value = true
  
  try {
    const response = await socketService.sendRequest(NodeEvent.Api, {
      path: '/cache/nodecustomer/CompanyUserCache/AllSystems',
      data: {
      },
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

// Lifecycle
onMounted(() => {
  // Load systems if we have a current system
  if (currentSystemId.value) {
    loadAvailableSystems()
  }
})
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>