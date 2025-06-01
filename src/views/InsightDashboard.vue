<template>
  <div class="insight-dashboard">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4">{{ dashboardTitle }}</h1>
        <p class="text-body-1 text-medium-emphasis">
          Context ID: {{ contextId || 'Not specified' }} | Type: {{ dashboardType }}
          <span v-if="objectId"> | Object ID: {{ objectId }}</span>
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

    <!-- Default Dashboard Layout when no template found -->
    <dashboard-layout
      v-else-if="!loading && !error && !dashboardData"
      :layout="getDefaultDashboardLayout()"
      @module-not-found="handleModuleNotFound"
    />

    <!-- Fallback Content (should not be shown normally) -->
    <v-row v-else-if="false">
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

// Layout type mapping - maps URL segments to dashboard layout types
// Note: For most types, we use the URL segment directly (e.g., 'project' -> 'project')
// This matches the old system's DashBoardEnum values
const layoutTypeMap: Record<string, string> = {
  dashboard: 'dashboard',  // Changed from 'insightDashboard' to match old system
  companies: 'company',    // Match old system's 'company'
  contracts: 'contract',   // Match old system's 'contract'
  documents: 'dataroom',   // Match old system's 'dataroom'
  analytics: 'analytics',
  reports: 'reports',
  settings: 'settings',
  // Direct mappings for old system dashboard types
  project: 'project',
  task: 'task',
  user: 'user',
  personaldashboard: 'personaldashboard',
  chat: 'chat',
  duediligence: 'duediligence',
  timebank: 'timebank',
  shareholder: 'shareholder',
  subaccount: 'subaccount',
  smsservice: 'smsservice',
  tagedit: 'tagedit',
  emailtemplate: 'emailtemplate',
  wergelandorder: 'wergelandorder'
}

// Computed
const contextId = computed(() => route.query.contextId as string || null)

// Parse dashboard type and object ID from the route
// For URLs like /insight/project/14038, extract 'project' as type and '14038' as object ID
const parsedRoute = computed(() => {
  const page = route.params.page
  let pathParts: string[] = []
  
  if (Array.isArray(page)) {
    pathParts = page
  } else if (page) {
    pathParts = [page]
  }
  
  // Extract dashboard type (first part) and object ID (second part if numeric)
  const dashboardType = pathParts[0] || 'dashboard'
  let objectId: string | undefined = undefined
  
  // Check if second part is a numeric ID
  if (pathParts.length >= 2 && /^\d+$/.test(pathParts[1])) {
    objectId = pathParts[1]
  }
  
  return {
    dashboardType,
    objectId,
    fullPath: pathParts.join('/')
  }
})

// Get the dashboard type from the parsed route
const dashboardType = computed(() => parsedRoute.value.dashboardType)

// Get the object ID from the parsed route (if present)
const objectId = computed(() => parsedRoute.value.objectId)

// Dashboard title based on type
const dashboardTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Insight Dashboard',
    companies: 'Company Overview',
    contracts: 'Contract Management',
    documents: 'Document Center',
    analytics: 'Analytics Dashboard',
    reports: 'Reports',
    settings: 'Dashboard Settings',
    project: 'Project Dashboard',
    task: 'Task Dashboard',
    user: 'User Dashboard',
    personaldashboard: 'Personal Dashboard',
    chat: 'Chat Dashboard',
    duediligence: 'Due Diligence',
    timebank: 'Timebank Dashboard',
    shareholder: 'Shareholder Dashboard',
    subaccount: 'Sub-account Dashboard',
    smsservice: 'SMS Service Dashboard',
    tagedit: 'Tag Editor',
    emailtemplate: 'Email Template Dashboard',
    wergelandorder: 'Wergeland Order Dashboard'
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
  objectId: objectId.value,
  parsedRoute: parsedRoute.value,
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
const getDefaultDashboardLayout = () => {
  // Return a default dashboard layout that matches the old system's structure
  // This is used when no dashboard template is found in the cache
  return {
    PageSettings: {
      // Default page settings can be added here if needed
    },
    Desktop: [] // Empty desktop array - the DashboardLayout component will handle this
  }
}

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
      portalID: templateService.getPortalID(),
      dashboardType: dashboardType.value,
      objectId: objectId.value
    })
    
    // Get dashboard layout for the specific dashboard type
    const layoutType = layoutTypeMap[dashboardType.value] || dashboardType.value
    
    // The template service will automatically use the current system's UniqueKey
    // Pass the object ID (from URL path) as the third parameter for object-specific layouts
    const layout = await templateService.getDashboardLayout(layoutType, undefined, objectId.value || undefined)
    
    if (layout) {
      dashboardData.value = layout
      console.log('Loaded dashboard layout from template service')
    } else {
      console.log('No dashboard layout found in template service - will use default empty dashboard')
      // If no layout from template service, dashboardData remains null
      // and the default dashboard layout will be shown
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
let lastKnownDomain = getDomain()
watch(() => getDomain(), async (newDomain) => {
  if (newDomain !== lastKnownDomain) {
    console.log('Domain changed, reloading portal settings:', { 
      oldDomain: lastKnownDomain, 
      newDomain,
      useportal: localStorage.getItem('useportal')
    })
    lastKnownDomain = newDomain
    // Reinitialize portal and reload dashboard
    await templateService.reinitializePortal()
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