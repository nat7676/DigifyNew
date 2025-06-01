<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Profile</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <!-- Profile Card -->
        <v-card>
          <v-card-text class="text-center pa-8">
            <v-avatar
              size="120"
              class="mb-4"
            >
              <v-img
                v-if="userProfile?.ProfileImage"
                :src="userProfile.ProfileImage"
                :alt="userProfile.Name"
              />
              <v-icon
                v-else
                size="64"
              >
                mdi-account-circle
              </v-icon>
            </v-avatar>
            <h2 class="text-h5 mb-2">{{ userProfile?.Name || 'User' }}</h2>
            <p class="text-body-2 text-medium-emphasis">{{ userProfile?.Email || 'No email' }}</p>
            <v-chip
              class="mt-2"
              color="primary"
              label
              size="small"
            >
              Tel: {{ userProfile?.Tel || currentToken?.userid || 'N/A' }}
            </v-chip>
          </v-card-text>
          
          <v-divider />
          
          <v-card-actions>
            <v-btn
              block
              variant="tonal"
              @click="fetchUserData"
              :loading="loading"
            >
              <v-icon start>mdi-refresh</v-icon>
              Refresh User Data
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="8"
      >
        <!-- User Information -->
        <v-card class="mb-4">
          <v-card-title>User Information</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Phone Number</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ userProfile?.Tel || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>First Name</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ userProfile?.FirstName || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Email</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ userProfile?.Email || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="userData">
                <v-list-item-title>Unique User Key</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-truncate" style="max-width: 200px">{{ userData.UniqueUserKey || 'N/A' }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- System Information -->
        <v-card class="mb-4">
          <v-card-title>System Information</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>System ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ currentToken?.systemid || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Active System ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ userData?.ActiveSystemID || authStore.currentSystemId || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="userData">
                <v-list-item-title>Unique System Key</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-truncate" style="max-width: 200px">{{ userData.UniqueSystemKey || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="userData">
                <v-list-item-title>System Name</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ userData.SystemName || 'N/A' }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Portal Information -->
        <v-card class="mb-4">
          <v-card-title>Portal Information</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Portal ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ currentToken?.PortalID || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="portalSettings">
                <v-list-item-title>Portal Unique Key</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-truncate" style="max-width: 200px">{{ portalSettings.UniqueKey || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Domain</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ currentDomain }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Access & Roles -->
        <v-card>
          <v-card-title>Access & Roles</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Access Level ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ currentToken?.AccessLevelID || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Session ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ currentToken?.SessionID || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Token Expires</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ tokenExpiry }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Active Roles</v-list-item-title>
                <template #append>
                  <div>
                    <v-chip
                      v-for="role in activeRoles"
                      :key="role"
                      size="x-small"
                      class="ml-1"
                      color="primary"
                    >
                      {{ role }}
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Debug Info -->
    <v-row v-if="showDebug" class="mt-4">
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>Debug Information</v-expansion-panel-title>
            <v-expansion-panel-text>
              <pre>{{ debugInfo }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
// Removed unused import
import socketService from '@/services/socket.service'
import templateService from '@/services/template.service'
import { NodeEvent } from '@/modules/shared/shared'
import { useSystemContext } from '@/composables/useSystemContext'

const authStore = useAuthStore()

// Handle system context switching
useSystemContext()

// State
const loading = ref(false)
const userData = ref<any>(null)
const portalSettings = ref<any>(null)
const showDebug = ref(false)

// Computed
const currentToken = computed(() => authStore.currentToken)
const userProfile = computed(() => currentToken.value?.userProfile)

const activeRoles = computed(() => {
  if (!currentToken.value?.roles) return []
  return Object.entries(currentToken.value.roles)
    .filter(([_, hasRole]) => hasRole)
    .map(([roleId]) => {
      const roleNames: Record<string, string> = {
        '1': 'Super Admin',
        '2': 'Designer',
        '3': 'Developer',
        '4': 'Role Admin',
        '10': 'System Admin'
      }
      return roleNames[roleId] || `Role ${roleId}`
    })
})

const tokenExpiry = computed(() => {
  if (!currentToken.value?.expiredate) return 'N/A'
  const date = new Date(currentToken.value.expiredate)
  return date.toLocaleString()
})

const currentDomain = computed(() => {
  return window.location.hostname
})

const debugInfo = computed(() => {
  return JSON.stringify({
    currentToken: currentToken.value,
    userData: userData.value,
    portalSettings: portalSettings.value,
    templatePortalKey: templateService.getPortalUniqueKey(),
    templatePortalID: templateService.getPortalID(),
    templateSystemKey: templateService.getSystemUniqueKey()
  }, null, 2)
})

// Methods
const fetchUserData = async () => {
  loading.value = true
  try {
    // Fetch current user data from API
    const response = await socketService.sendRequest(NodeEvent.Api, {
      path: '/logininfo',
      data: {},
      settings: {}
    })
    
    // The response has a different structure - it's in tables format
    if (response.ApiResp?.tables?.[0]?.rows?.length > 0) {
      userData.value = response.ApiResp.tables[0].rows[0]
      
      // Store the UniqueSystemKey in template service for layout generation
      if (userData.value.UniqueSystemKey) {
        templateService.setSystemUniqueKey(userData.value.UniqueSystemKey)
      }
    }
  } catch (error) {
    // Silently fail
  } finally {
    loading.value = false
  }
}

const fetchPortalSettings = async () => {
  try {
    const domain = window.location.hostname
    const settings = await templateService.getPortalSettings(domain)
    if (settings) {
      portalSettings.value = settings
    }
  } catch (error) {
    // Silently fail
  }
}

// Watch for system changes and reload data
watch(() => authStore.currentSystemId, async (newSystemId, oldSystemId) => {
  if (newSystemId && newSystemId !== oldSystemId) {
    await fetchUserData()
  }
})

// Lifecycle
onMounted(async () => {
  // Toggle debug mode with keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      showDebug.value = !showDebug.value
    }
  })
  
  // Fetch data on mount
  await Promise.all([
    fetchUserData(),
    fetchPortalSettings()
  ])
})

// Listen for system switch events
const handleSystemSwitch = async () => {
  await fetchUserData()
}

onMounted(() => {
  window.addEventListener('system-switched', handleSystemSwitch)
})

onUnmounted(() => {
  window.removeEventListener('system-switched', handleSystemSwitch)
})
</script>