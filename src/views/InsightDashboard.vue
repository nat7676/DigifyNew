<template>
  <div class="insight-dashboard">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4">{{ dashboardTitle }}</h1>
        <p class="text-body-1 text-medium-emphasis">
          Context ID: {{ contextId || 'Not specified' }} | Type: {{ dashboardType }}
        </p>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="mt-4 text-body-1">Loading dashboard data...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="tonal"
        >
          <v-alert-title>Error loading dashboard</v-alert-title>
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Dashboard Layout from Template Cache -->
    <dashboard-layout
      v-else-if="dashboardData"
      :layout="dashboardData"
      @module-not-found="handleModuleNotFound"
    />

    <!-- Fallback Content when no template -->
    <v-row v-else>
      <!-- Contract Overview -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Contract Overview</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list lines="two">
              <v-list-item
                v-for="item in contractItems"
                :key="item.id"
              >
                <template #prepend>
                  <v-icon :icon="item.icon" />
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
                <template #append>
                  <v-chip
                    :color="item.status === 'active' ? 'success' : 'warning'"
                    size="small"
                    label
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Stats -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Statistics</v-card-title>
          <v-divider />
          <v-list density="compact">
            <v-list-item
              v-for="stat in stats"
              :key="stat.label"
            >
              <v-list-item-title>{{ stat.label }}</v-list-item-title>
              <template #append>
                <span class="text-h6">{{ stat.value }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Actions -->
        <v-card>
          <v-card-title>Actions</v-card-title>
          <v-divider />
          <v-card-text>
            <v-btn
              block
              color="primary"
              variant="tonal"
              prepend-icon="mdi-file-document-plus"
              class="mb-2"
              @click="createNewContract"
            >
              New Contract
            </v-btn>
            <v-btn
              block
              color="secondary"
              variant="tonal"
              prepend-icon="mdi-file-upload"
              @click="uploadDocument"
            >
              Upload Document
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Debug Info -->
    <v-row v-if="showDebug" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Debug Information</v-card-title>
          <v-divider />
          <v-card-text>
            <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'
import templateService from '@/services/template.service'
import { useSystemContext } from '@/composables/useSystemContext'
import DashboardLayout from '@/components/dashboard-modules/DashboardLayout.vue'
import { getDomain } from '@/utils/domain'

const route = useRoute()
const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

// Handle system context switching
useSystemContext()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const dashboardData = ref<any>(null)
const showDebug = ref(import.meta.env.DEV)

// Layout type mapping
const layoutTypeMap: Record<string, string> = {
  dashboard: 'insightDashboard',
  companies: 'companyDashboard',
  contracts: 'contractDashboard',
  documents: 'documentDashboard',
  analytics: 'analyticsDashboard',
  reports: 'reportsDashboard',
  settings: 'settingsDashboard'
}

// Computed
const contextId = computed(() => route.query.contextId as string || null)

// Get the dashboard type from the route - defaults to 'dashboard' if not specified
const dashboardType = computed(() => {
  const page = route.params.page
  if (Array.isArray(page)) {
    return page.join('/') || 'dashboard'
  }
  return page || 'dashboard'
})

// Dashboard title based on type
const dashboardTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Insight Dashboard',
    companies: 'Company Overview',
    contracts: 'Contract Management',
    documents: 'Document Center',
    analytics: 'Analytics Dashboard',
    reports: 'Reports',
    settings: 'Dashboard Settings'
  }
  return titles[dashboardType.value] || `${dashboardType.value.charAt(0).toUpperCase() + dashboardType.value.slice(1)} Dashboard`
})

// Mock data for now
const contractItems = ref([
  {
    id: 1,
    title: 'Contract #2024-001',
    subtitle: 'Due: 2024-12-31',
    icon: 'mdi-file-document',
    status: 'active'
  },
  {
    id: 2,
    title: 'Contract #2024-002',
    subtitle: 'Due: 2025-01-15',
    icon: 'mdi-file-document',
    status: 'pending'
  },
  {
    id: 3,
    title: 'Contract #2024-003',
    subtitle: 'Completed: 2024-11-20',
    icon: 'mdi-file-document-check',
    status: 'completed'
  }
])

const stats = ref([
  { label: 'Active Contracts', value: 12 },
  { label: 'Pending Review', value: 3 },
  { label: 'Documents', value: 47 },
  { label: 'Users', value: 8 }
])

const debugInfo = computed(() => ({
  contextId: contextId.value,
  dashboardType: dashboardType.value,
  route: {
    path: route.path,
    query: route.query,
    params: route.params
  },
  auth: {
    isAuthenticated: authStore.isAuthenticated,
    currentSystem: authStore.currentToken?.systemid,
    userId: authStore.user?.userid
  },
  templateCache: {
    isLoading: loading.value,
    hasError: !!error.value,
    hasDashboardData: !!dashboardData.value,
    layoutType: layoutTypeMap[dashboardType.value] || dashboardType.value
  },
  dashboardData: dashboardData.value
}))

// Methods
const loadDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    // Load template cache data from service
    // Use getDomain to handle localhost portal overrides correctly
    const domain = getDomain()
    
    // Ensure portal settings are loaded first
    if (!templateService.isPortalInitialized()) {
      console.log('Portal not initialized, loading portal settings...')
      await templateService.getPortalSettings(domain) // This sets the portal unique key internally
    }
    
    // Check if we have the system unique key (for debugging)
    console.log('Loading dashboard with keys:', {
      systemUniqueKey: templateService.getSystemUniqueKey(),
      portalUniqueKey: templateService.getPortalUniqueKey(),
      portalID: templateService.getPortalID()
    })
    
    // Get dashboard layout for the specific dashboard type
    const layoutType = layoutTypeMap[dashboardType.value] || dashboardType.value
    
    // The template service will automatically use the current system's UniqueKey
    const layout = await templateService.getDashboardLayout(layoutType, undefined, contextId.value || undefined)
    
    if (layout) {
      dashboardData.value = layout
      console.log('Loaded dashboard layout from template service:', layout)
    } else {
      console.log('No dashboard layout found in template service')
      // If no layout from template service, dashboardData remains null
      // and the fallback content will be shown
    }
    
    // If we have a contextId, use it for loading system-specific data
    if (contextId.value) {
      const systemId = parseInt(contextId.value)
      
      // Update the system store with the context ID
      systemStore.setCurrentSystemId(systemId)
    }
    
    loading.value = false
  } catch (err: any) {
    console.error('Failed to load dashboard:', err)
    error.value = err.message || 'Failed to load dashboard data'
    loading.value = false
  }
}

const createNewContract = () => {
  uiStore.showSnackbar('Create new contract feature coming soon')
}

const uploadDocument = () => {
  uiStore.showSnackbar('Upload document feature coming soon')
}

const handleModuleNotFound = (moduleName: string, element: any) => {
  console.warn(`Module not found: ${moduleName}`, element)
  uiStore.showSnackbar({
    text: `Module "${moduleName}" is not available`,
    color: 'warning'
  })
}

// Watch for context ID changes to reload data
watch(contextId, async (newContextId, oldContextId) => {
  if (newContextId && newContextId !== oldContextId) {
    // System switching is handled by useSystemContext composable
    // Just reload the dashboard data for the new context
    loadDashboardData()
  }
}, { immediate: false })

// Watch for dashboard type changes to reload data
watch(dashboardType, async (newType, oldType) => {
  if (newType !== oldType) {
    console.log(`Dashboard type changed from ${oldType} to ${newType}`)
    loadDashboardData()
  }
}, { immediate: false })

// Watch for domain changes (e.g., when switching portals in localhost)
watch(() => getDomain(), async (newDomain, oldDomain) => {
  if (newDomain !== oldDomain) {
    console.log('Domain changed, reloading portal settings:', { oldDomain, newDomain })
    // Clear portal data and reload
    templateService.clearPortalData()
    await loadDashboardData()
  }
})

// Lifecycle
onMounted(async () => {
  // System switching is handled by useSystemContext composable
  loadDashboardData()
  
  // Listen for system switch events to reload layout
  const handleSystemSwitch = () => {
    loadDashboardData()
  }
  
  const handleSystemKeyChange = () => {
    loadDashboardData()
  }
  
  window.addEventListener('system-switched', handleSystemSwitch)
  window.addEventListener('system-unique-key-changed', handleSystemKeyChange)
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('system-switched', handleSystemSwitch)
    window.removeEventListener('system-unique-key-changed', handleSystemKeyChange)
  })
})
</script>

<style scoped>
.insight-dashboard {
  padding: 0;
}
</style>