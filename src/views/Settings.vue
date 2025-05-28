<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Settings</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <!-- Appearance Settings -->
        <v-card class="mb-4">
          <v-card-title>Appearance</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Dark Mode</v-list-item-title>
                <v-list-item-subtitle>Toggle dark theme</v-list-item-subtitle>
                <template #append>
                  <v-switch
                    v-model="darkMode"
                    density="compact"
                    hide-details
                    @update:model-value="toggleDarkMode"
                  />
                </template>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Compact Navigation</v-list-item-title>
                <v-list-item-subtitle>Use rail navigation drawer</v-list-item-subtitle>
                <template #append>
                  <v-switch
                    v-model="rail"
                    density="compact"
                    hide-details
                    @update:model-value="toggleRail"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- System Settings -->
        <v-card class="mb-4">
          <v-card-title>System</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Server URL</v-list-item-title>
                <v-list-item-subtitle>{{ serverUrl }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Current System</v-list-item-title>
                <v-list-item-subtitle>System ID: {{ currentSystemId }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Version</v-list-item-title>
                <v-list-item-subtitle>{{ appVersion }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Development Settings -->
        <v-card v-if="isDevelopment">
          <v-card-title>Development</v-card-title>
          <v-divider />
          <v-card-text>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Development mode is enabled
            </v-alert>
            
            <v-btn
              color="primary"
              @click="clearCache"
            >
              Clear Cache
            </v-btn>
            
            <v-btn
              color="warning"
              class="ml-2"
              @click="resetSettings"
            >
              Reset All Settings
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'

const systemStore = useSystemStore()
const uiStore = useUIStore()

// Computed
const darkMode = computed(() => uiStore.darkMode)
const rail = computed(() => uiStore.rail)
const serverUrl = computed(() => systemStore.serverUrl)
const currentSystemId = computed(() => systemStore.currentSystemId)
const appVersion = computed(() => systemStore.appVersion)
const isDevelopment = computed(() => systemStore.isDevelopment)

// Methods
const toggleDarkMode = () => {
  uiStore.toggleDarkMode()
}

const toggleRail = () => {
  uiStore.toggleRail()
}

const clearCache = () => {
  // TODO: Implement cache clearing
  localStorage.clear()
  uiStore.showSuccess('Cache cleared successfully')
}

const resetSettings = async () => {
  const confirmed = await uiStore.confirm(
    'Reset Settings',
    'Are you sure you want to reset all settings to default values?'
  )
  
  if (confirmed) {
    localStorage.clear()
    location.reload()
  }
}
</script>