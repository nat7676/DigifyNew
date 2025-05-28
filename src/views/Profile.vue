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
                v-if="user?.profileImage"
                :src="user.profileImage"
                :alt="user.name"
              />
              <v-icon
                v-else
                size="64"
              >
                mdi-account-circle
              </v-icon>
            </v-avatar>
            <h2 class="text-h5 mb-2">{{ user?.name || 'User' }}</h2>
            <p class="text-body-2 text-medium-emphasis">{{ user?.email || 'No email' }}</p>
            <v-chip
              class="mt-2"
              color="primary"
              label
              size="small"
            >
              User ID: {{ user?.userid || 'N/A' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="8"
      >
        <!-- Profile Details -->
        <v-card>
          <v-card-title>Profile Information</v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-1 mb-4">
              This is a placeholder profile page. Profile editing functionality will be implemented here.
            </p>
            
            <v-list>
              <v-list-item>
                <v-list-item-title>System ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ user?.systemid || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Portal ID</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ user?.PortalID || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Access Level</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ user?.AccessLevelID || 'N/A' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Roles</v-list-item-title>
                <template #append>
                  <span class="text-body-2">{{ rolesList }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const user = computed(() => authStore.user)

const rolesList = computed(() => {
  if (!user.value?.roles) return 'None'
  return Object.entries(user.value.roles)
    .filter(([_, hasRole]) => hasRole)
    .map(([roleId]) => `Role ${roleId}`)
    .join(', ')
})
</script>