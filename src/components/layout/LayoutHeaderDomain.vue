<template>
  <v-menu
    v-if="isLocalhost"
    v-model="menu"
    :close-on-content-click="false"
    location="bottom"
    min-width="400"
    @update:model-value="handleMenuChange"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        data-portal-selector
      >
        <v-icon color="white">mdi-link-box-outline</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="text-body-1">
        Selected: {{ currentDomain }}
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-0">
        <v-text-field
          v-if="portals.length > 5"
          v-model="searchQuery"
          placeholder="Search portals..."
          density="compact"
          variant="solo-filled"
          flat
          hide-details
          class="mb-2"
          prepend-inner-icon="mdi-magnify"
          clearable
        />
        
        <v-list
          v-if="!loading && filteredPortals.length > 0"
          density="compact"
          max-height="300"
          class="overflow-y-auto"
        >
          <v-list-item
            v-for="portal in filteredPortals"
            :key="portal.PortalID"
            @click="selectPortal(portal)"
            class="cursor-pointer"
          >
            <v-list-item-title>{{ portal.Name }}</v-list-item-title>
            <v-list-item-subtitle>{{ portal.Domain }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        
        <div v-else-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            size="24"
          />
          <p class="text-caption mt-2">Loading portals...</p>
        </div>
        
        <div v-else class="text-center py-4 text-body-2 text-medium-emphasis">
          No portals found
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
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
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>