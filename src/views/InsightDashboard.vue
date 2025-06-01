<template>
  <div class="insight-dashboard">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4">Insight Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis">
          Context ID: {{ contextId || 'Not specified' }}
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'
import templateService from '@/services/template.service'
import { useSystemContext } from '@/composables/useSystemContext'
import DashboardLayout from '@/components/dashboard-modules/DashboardLayout.vue'

const route = useRoute()
const router = useRouter()
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

// Computed
const contextId = computed(() => route.query.contextId as string || null)

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
    hasDashboardData: !!dashboardData.value
  },
  dashboardData: dashboardData.value
}))

// Methods
const loadDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    // For testing with the provided template cache response
    // This would normally come from templateService.getDashboardLayout()
    const mockTemplateCacheResponse = {
      Event: "TemplateCache",
      SubmitType: "Response",
      Guid: "8b58ffbd-610d-41dc-b2bc-443bdf3b466c",
      TemplateCacheResp: [
        {
          UniqueKey: "80a609acd428c45852532fbf52e1d8cd36288069bbd0a6aafa80784b99273480",
          Content: "{\"Desktop\":[{\"uniqueid\":\"c209485f-ed7e-56a2-83a8-27971f77e98a\",\"col\":[{\"uniqueid\":\"2bd1618c-70ee-e496-9e98-782a1bf8cf02\",\"md\":12,\"elements\":[{\"uniqueid\":\"3561238b-6b71-d869-13ae-6f2fc63af8e7\",\"element\":\"wergelandOrders\",\"Settings\":[{\"ObjectType\":1,\"ObjectID\":\"3500513\"},{\"ObjectType\":32,\"ObjectID\":\"4745689944\"}],\"PageSettingsMinimizedMargins\":{\"boolvalue\":false},\"PageSettingsMinimizedModules\":{\"boolvalue\":false}}],\"sections\":[]}]}],\"settings\":{\"RequireLogin\":false,\"backurl\":\"\",\"backtitle\":\"\",\"MappedTagLists\":[],\"MappedCompanyLists\":[],\"MappedAutoTagLists\":[],\"ObjectTypeID\":null,\"PageSettingsMinimizedMargins\":{\"boolvalue\":false},\"PageSettingsMinimizedModules\":{\"boolvalue\":false},\"PageSettingsSetState\":{\"left\":\"notactive\",\"right\":\"notactive\",\"top\":\"notactive\",\"bottom\":\"notactive\"}},\"PageSettings\":{\"RequireLogin\":false,\"backurl\":\"\",\"backtitle\":\"\",\"MappedTagLists\":[],\"MappedCompanyLists\":[],\"MappedAutoTagLists\":[],\"ObjectTypeID\":null,\"PageSettingsMinimizedMargins\":{\"boolvalue\":false},\"PageSettingsMinimizedModules\":{\"boolvalue\":false},\"PageSettingsSetState\":{\"left\":\"notactive\",\"right\":\"notactive\",\"top\":\"notactive\",\"bottom\":\"notactive\"}}}"
        }
      ]
    }
    
    // Parse the template cache response
    if (mockTemplateCacheResponse.TemplateCacheResp && mockTemplateCacheResponse.TemplateCacheResp.length > 0) {
      const templateData = mockTemplateCacheResponse.TemplateCacheResp[0]
      try {
        const parsedContent = JSON.parse(templateData.Content)
        dashboardData.value = parsedContent
        console.log('Loaded dashboard layout:', parsedContent)
      } catch (parseError) {
        console.error('Failed to parse template content:', parseError)
        error.value = 'Failed to parse dashboard template'
      }
    }
    
    // Load template cache data from service (commented out for testing)
    /*
    const domain = window.location.hostname
    const portalSettings = await templateService.getPortalSettings(domain)
    
    const systemUniqueKey = templateService.getSystemUniqueKey()
    
    const layout = await templateService.getDashboardLayout(
      'insightDashboard'
    )
    
    if (layout) {
      dashboardData.value = layout
    }
    */
    
    // If we have a contextId, use it for loading system-specific data
    if (contextId.value) {
      const systemId = parseInt(contextId.value)
      
      // Update the system store with the context ID
      systemStore.setCurrentSystemId(systemId)
      
      // Load context-specific data
      // Note: The actual data loading would happen here based on the contextId
      // For now, we're just using mock data
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
  uiStore.showSnackbar(`Module "${moduleName}" is not available`, 'warning')
}

// Watch for context ID changes to reload data
watch(contextId, async (newContextId, oldContextId) => {
  if (newContextId && newContextId !== oldContextId) {
    // System switching is handled by useSystemContext composable
    // Just reload the dashboard data for the new context
    loadDashboardData()
  }
}, { immediate: false })

// Lifecycle
onMounted(async () => {
  // System switching is handled by useSystemContext composable
  loadDashboardData()
  
  // Listen for system switch events to reload layout
  const handleSystemSwitch = () => {
    loadDashboardData()
  }
  
  const handleSystemKeyChange = (event: any) => {
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