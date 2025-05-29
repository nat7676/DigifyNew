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

    <!-- Dashboard Content -->
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
import { ref, computed, onMounted, watch } from 'vue'
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
    hasError: !!error.value
  }
}))

// Methods
const loadDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    // Load template cache data
    console.log('Loading insight dashboard with contextId:', contextId.value)
    
    // Get domain settings first
    const domain = window.location.hostname
    const portalSettings = await templateService.getPortalSettings(domain)
    console.log('Portal settings:', portalSettings)
    
    if (portalSettings) {
      // Get dashboard layout for insight dashboard
      const layout = await templateService.getDashboardLayout(
        'insightDashboard', // layout type
        portalSettings.UniqueKey, // portal unique key
        contextId.value || undefined, // system unique key (contextId)
        undefined // object ID
      )
      console.log('Dashboard layout:', layout)
      
      if (layout) {
        dashboardData.value = layout
      }
    }
    
    // If we have a contextId, we might need to switch system context
    if (contextId.value) {
      // Update the system store with the context ID
      systemStore.setCurrentSystemId(parseInt(contextId.value))
      
      // TODO: Load context-specific data
      console.log('Loading context-specific data for:', contextId.value)
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

// Watch for context ID changes
watch(contextId, (newContextId) => {
  if (newContextId) {
    loadDashboardData()
  }
})

// Lifecycle
onMounted(() => {
  console.log('InsightDashboard mounted with query:', route.query)
  loadDashboardData()
})
</script>

<style scoped>
.insight-dashboard {
  padding: 0;
}
</style>