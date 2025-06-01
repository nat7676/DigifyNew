<template>
  <DashboardCard 
    :element="element"
  >
    <!-- Main Toggle Button -->
    <div class="pa-2">
      <v-btn
        block
        size="large"
        :variant="settings.buttonVariant"
        :color="settings.showColor ? (isDarkMode ? 'grey-darken-3' : 'amber') : undefined"
        @click="toggleDarkMode"
        class="darkmode-toggle"
      >
        <v-icon :color="settings.showColor && !isDarkMode ? 'amber-darken-2' : undefined">
          mdi-weather-sunny
        </v-icon>
        <v-switch
          :model-value="isDarkMode"
          hide-details
          :color="settings.showColor ? 'primary' : undefined"
          class="mx-3"
          @click.stop
          @update:model-value="toggleDarkMode"
        />
        <v-icon :color="settings.showColor && isDarkMode ? 'blue-grey' : undefined">
          mdi-weather-night
        </v-icon>
      </v-btn>
      
      <!-- Current Mode Text -->
      <div v-if="settings.showText" class="text-center mt-3 text-body-2 text-medium-emphasis">
        {{ isDarkMode ? 'Dark Mode' : 'Light Mode' }}
      </div>
    </div>
    
    <!-- Edit Mode Settings -->
    <template #editcontent v-if="element.EditMode">
      <div class="pa-4">
        <p class="text-subtitle-2 mb-3">Appearance Settings</p>
        
        <v-select
          v-model="settings.buttonVariant"
          label="Button Style"
          :items="buttonVariants"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        
        <CheckBox
          v-model="settings.showText"
          label="Show mode text"
          class="mb-2"
        />
        
        <CheckBox
          v-model="settings.showColor"
          label="Show color indicators"
          class="mb-2"
        />
        
        <CheckBox
          v-model="settings.syncWithSystem"
          label="Sync with system theme"
          hint="Automatically match your system's dark mode preference"
        />
      </div>
    </template>
  </DashboardCard>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import DashboardCard from '@/components/ui/DashboardCard.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import { useUIStore } from '@/stores/ui'

interface LayoutDarkmodeSettings {
  buttonVariant: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'plain'
  showText: boolean
  showColor: boolean
  syncWithSystem: boolean
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  LayoutDarkmode?: LayoutDarkmodeSettings
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()
const uiStore = useUIStore()

// Initialize settings
const getSettings = (): LayoutDarkmodeSettings => {
  if (!props.element.LayoutDarkmode) {
    const defaultSettings: LayoutDarkmodeSettings = {
      buttonVariant: 'tonal',
      showText: false,
      showColor: true,
      syncWithSystem: false
    }
    props.element.LayoutDarkmode = defaultSettings
  }
  return props.element.LayoutDarkmode
}

const settings = reactive(getSettings())

// Button variant options
const buttonVariants = [
  { title: 'Flat', value: 'flat' },
  { title: 'Elevated', value: 'elevated' },
  { title: 'Tonal', value: 'tonal' },
  { title: 'Outlined', value: 'outlined' },
  { title: 'Text', value: 'text' },
  { title: 'Plain', value: 'plain' }
]

// Computed
const isDarkMode = computed(() => uiStore.isDarkMode)

// Methods
const toggleDarkMode = () => {
  uiStore.toggleDarkMode()
}

// Watch for settings changes
watch(settings, (newSettings) => {
  props.element.LayoutDarkmode = { ...newSettings }
}, { deep: true })

// System theme sync
watch(() => settings.syncWithSystem, (syncEnabled) => {
  if (syncEnabled && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (mediaQuery.matches !== isDarkMode.value) {
      toggleDarkMode()
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* Ensure the switch doesn't interfere with button click */
:deep(.v-switch) {
  pointer-events: none;
}

:deep(.v-switch__track) {
  pointer-events: auto;
}

:deep(.v-switch__thumb) {
  pointer-events: auto;
}

.darkmode-toggle {
  transition: all 0.3s ease;
}

.darkmode-toggle:hover {
  transform: scale(1.02);
}

/* Theme-specific button styling */
:deep(.v-theme--dark) .darkmode-toggle {
  background: linear-gradient(135deg, #1a237e 0%, #311b92 100%) !important;
}

:deep(.v-theme--light) .darkmode-toggle {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%) !important;
}
</style>