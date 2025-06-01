<template>
  <v-app>
    <v-layout>
      <!-- Navigation Drawer -->
      <v-navigation-drawer
        v-if="isAuthenticated"
        v-model="drawer"
        :rail="rail"
        permanent
      >
        <!-- Dynamic Menu -->
        <dynamic-menu />
        </v-navigation-drawer>

      <!-- App Bar -->
      <v-app-bar
        v-if="isAuthenticated"
        color="primary"
        prominent
      >
        <v-app-bar-nav-icon
          variant="text"
          @click="drawer = !drawer"
        />
        <v-toolbar-title>Digify</v-toolbar-title>
        <v-spacer />
        
        <!-- System Selector -->
        <system-selector v-if="isAuthenticated" class="mr-4" />
        
        <!-- User Info and Menu -->
        <div v-if="user" class="d-flex align-center">
          <div class="text-right mr-2">
            <div class="text-body-2 font-weight-medium">{{ user.name }}</div>
          </div>
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                icon
                v-bind="props"
              >
                <v-avatar size="36">
                  <v-img
                    v-if="user.profileImage"
                    :src="user.profileImage"
                    :alt="user.name"
                  />
                  <v-icon v-else>mdi-account-circle</v-icon>
                </v-avatar>
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-list-item-title>{{ user.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider />
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Toggle Edit Mode"
                subtitle="Ctrl+D"
                @click="uiStore.toggleEditMode()"
              >
                <template #append>
                  <v-icon v-if="isEditMode" color="warning" size="small">
                    mdi-circle
                  </v-icon>
                </template>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi-logout"
                title="Logout"
                @click="logout"
              />
            </v-list>
          </v-menu>
        </div>
      </v-app-bar>

      <!-- Edit Mode Banner -->
      <v-banner
        v-if="isEditMode"
        class="edit-mode-banner"
        color="warning"
        icon="mdi-pencil"
        sticky
      >
        <v-banner-text>
          <strong>Edit Mode Active</strong> - You can now edit dashboard elements
        </v-banner-text>
        <template #actions>
          <v-btn
            variant="text"
            @click="uiStore.toggleEditMode()"
          >
            Exit Edit Mode
          </v-btn>
        </template>
      </v-banner>

      <!-- Main Content -->
      <v-main>
        <v-container fluid>
          <router-view v-slot="{ Component }">
            <transition
              name="fade"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </v-container>
      </v-main>
    </v-layout>

    <!-- Global Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="loading"
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular
        indeterminate
        size="64"
      />
    </v-overlay>

    <!-- Debug Toolbar (floating, always accessible on localhost) -->
    <debug-toolbar />
    
    <!-- Hidden Portal Selector (triggered by debug toolbar) -->
    <portal-selector />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import DynamicMenu from '@/components/layout/DynamicMenu.vue'
import SystemSelector from '@/components/layout/SystemSelector.vue'
import DebugToolbar from '@/components/layout/DebugToolbar.vue'
import PortalSelector from '@/components/layout/PortalSelector.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Reactive state
const drawer = ref(true)
const rail = ref(false)
const loading = ref(false)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)
const snackbar = computed(() => uiStore.snackbar)
const isEditMode = computed(() => uiStore.isEditMode)

// Methods
// Removed unused navigateTo function - navigation is handled by router-link
// const navigateTo = (path: string) => {
//   // Get the current contextId from the URL
//   const currentRoute = router.currentRoute.value
//   const contextId = currentRoute.query.contextId || authStore.currentSystemId || 1
//   
//   // Navigate preserving the contextId
//   router.push({
//     path,
//     query: { contextId }
//   })
// }

const logout = async () => {
  loading.value = true
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    uiStore.showError('Failed to logout')
  } finally {
    loading.value = false
  }
}

// Keyboard shortcuts handler
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl+D to toggle edit mode
  if (event.ctrlKey && event.key === 'd') {
    event.preventDefault() // Prevent browser bookmark dialog
    if (isAuthenticated.value) {
      uiStore.toggleEditMode()
    }
  }
}

// Lifecycle
onMounted(() => {
  // Check authentication status
  if (!isAuthenticated.value) {
    router.push('/login')
  }

  // Register keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Cleanup keyboard shortcuts
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.edit-mode-banner {
  z-index: 1000;
}
</style>