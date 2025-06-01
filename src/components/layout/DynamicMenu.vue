<template>
  <v-list
    density="comfortable"
    nav
  >
    <dynamic-menu-item
      v-for="(item, index) in menuItems"
      :key="`menu-${index}`"
      :item="item"
      :level="0"
    />
  </v-list>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from '@/types/menu'
import menuService from '@/services/menu.service'
import DynamicMenuItem from './DynamicMenuItem.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// State
const menuItems = ref<MenuItem[]>([])
const loading = ref(true)

// Load menu items
const loadMenu = async () => {
  loading.value = true
  try {
    const items = await menuService.getMenu()
    menuItems.value = items
  } catch (error) {
    console.error('Failed to load menu:', error)
    // Fall back to default menu
    menuItems.value = menuService.buildMainNavigationMenu()
  } finally {
    loading.value = false
  }
}

// Reload menu when system changes
watch(() => authStore.currentSystemId, () => {
  loadMenu()
})

// Reload menu when route changes (context might change)
watch(() => route.query.contextId, () => {
  loadMenu()
})

onMounted(() => {
  loadMenu()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>