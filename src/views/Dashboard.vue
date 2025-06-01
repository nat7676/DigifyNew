<template>
  <div class="dashboard">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4">Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis">Welcome back, {{ userName }}</p>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col
        v-for="stat in stats"
        :key="stat.title"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card>
          <v-card-text class="d-flex align-center">
            <div class="flex-grow-1">
              <p class="text-body-2 text-medium-emphasis mb-1">{{ stat.title }}</p>
              <p class="text-h5 font-weight-medium">{{ stat.value }}</p>
              <p
                v-if="stat.change"
                class="text-body-2"
                :class="stat.change > 0 ? 'text-success' : 'text-error'"
              >
                <v-icon size="small">
                  {{ stat.change > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                {{ Math.abs(stat.change) }}%
              </p>
            </div>
            <v-avatar
              :color="stat.color"
              size="48"
              class="ml-4"
            >
              <v-icon
                :icon="stat.icon"
                size="24"
              />
            </v-avatar>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Area -->
    <v-row>
      <!-- Recent Activity -->
      <v-col
        cols="12"
        md="8"
      >
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list lines="two">
              <v-list-item
                v-for="activity in recentActivities"
                :key="activity.id"
              >
                <template #prepend>
                  <v-avatar
                    :color="activity.color"
                    size="40"
                  >
                    <v-icon
                      :icon="activity.icon"
                      size="20"
                    />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.subtitle }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ activity.time }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-divider />
          <v-card-text>
            <v-btn
              v-for="action in quickActions"
              :key="action.title"
              block
              :color="action.color"
              variant="tonal"
              class="mb-2"
              :prepend-icon="action.icon"
              @click="handleAction(action)"
            >
              {{ action.title }}
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- System Info -->
        <v-card class="mt-4">
          <v-card-title>System Info</v-card-title>
          <v-divider />
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>Version</v-list-item-title>
              <template #append>
                <span class="text-body-2">{{ appVersion }}</span>
              </template>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>System</v-list-item-title>
              <template #append>
                <span class="text-body-2">{{ systemName }}</span>
              </template>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Status</v-list-item-title>
              <template #append>
                <v-chip
                  :color="isOnline ? 'success' : 'error'"
                  size="small"
                  label
                >
                  {{ isOnline ? 'Online' : 'Offline' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Token Test Section (Debug) -->
    <v-row class="mt-6">
      <v-col cols="12">
        <TestTokenAuth />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'
import TestTokenAuth from '@/components/TestTokenAuth.vue'

const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

// Computed
const userName = computed(() => authStore.user?.name || 'User')
const appVersion = computed(() => systemStore.appVersion)
const systemName = computed(() => systemStore.systemName)
const isOnline = computed(() => systemStore.isOnline)

// Mock data
const stats = ref([
  {
    title: 'Total Users',
    value: '1,234',
    change: 12,
    icon: 'mdi-account-group',
    color: 'primary'
  },
  {
    title: 'Active Sessions',
    value: '456',
    change: -5,
    icon: 'mdi-account-clock',
    color: 'success'
  },
  {
    title: 'Documents',
    value: '789',
    change: 8,
    icon: 'mdi-file-document',
    color: 'warning'
  },
  {
    title: 'Messages',
    value: '234',
    change: 15,
    icon: 'mdi-message',
    color: 'info'
  }
])

const recentActivities = ref([
  {
    id: 1,
    title: 'New user registration',
    subtitle: 'John Doe joined the system',
    time: '5 min ago',
    icon: 'mdi-account-plus',
    color: 'primary'
  },
  {
    id: 2,
    title: 'Document uploaded',
    subtitle: 'Contract_2024.pdf was uploaded',
    time: '15 min ago',
    icon: 'mdi-file-upload',
    color: 'success'
  },
  {
    id: 3,
    title: 'System update',
    subtitle: 'System was updated to v1.2.0',
    time: '1 hour ago',
    icon: 'mdi-update',
    color: 'info'
  },
  {
    id: 4,
    title: 'New message',
    subtitle: 'You have a new message from Admin',
    time: '2 hours ago',
    icon: 'mdi-message',
    color: 'warning'
  }
])

const quickActions = ref([
  {
    title: 'Create User',
    icon: 'mdi-account-plus',
    color: 'primary',
    action: 'createUser'
  },
  {
    title: 'Upload Document',
    icon: 'mdi-file-upload',
    color: 'success',
    action: 'uploadDocument'
  },
  {
    title: 'Send Message',
    icon: 'mdi-send',
    color: 'info',
    action: 'sendMessage'
  },
  {
    title: 'View Reports',
    icon: 'mdi-chart-line',
    color: 'warning',
    action: 'viewReports'
  }
])

// Methods
const handleAction = (action: any) => {
  // TODO: Implement actions
  uiStore.showWarning(`Action "${action.title}" not implemented yet`)
}

// Lifecycle
onMounted(() => {
  // TODO: Load actual dashboard data
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
</style>