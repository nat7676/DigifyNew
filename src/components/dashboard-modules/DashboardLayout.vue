<template>
  <div class="dashboard-layout">
    <v-container fluid :class="{ 'pa-0': minimizedMargins }">
      <!-- Render each section -->
      <dashboard-section
        v-for="section in sections"
        :key="section.uniqueid"
        :section="section"
        :minimized-modules="minimizedModules"
        @module-not-found="handleModuleNotFound"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardSection from './DashboardSection.vue'

interface DashboardElement {
  uniqueid: string
  element: string
  Settings?: any[]
  [key: string]: any
}

interface DashboardColumn {
  uniqueid: string
  md: number
  elements: DashboardElement[]
  sections?: DashboardSection[]
}

interface DashboardSection {
  uniqueid: string
  col: DashboardColumn[]
}

interface DashboardSettings {
  PageSettingsMinimizedMargins?: { boolvalue: boolean }
  PageSettingsMinimizedModules?: { boolvalue: boolean }
  [key: string]: any
}

interface Props {
  layout: {
    Desktop?: DashboardSection[]
    settings?: DashboardSettings
    PageSettings?: DashboardSettings
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'module-not-found': [moduleName: string, element: DashboardElement]
}>()

// Computed properties
const sections = computed(() => props.layout?.Desktop || [])

const settings = computed(() => props.layout?.settings || props.layout?.PageSettings || {})

const minimizedMargins = computed(() => 
  settings.value.PageSettingsMinimizedMargins?.boolvalue || false
)

const minimizedModules = computed(() => 
  settings.value.PageSettingsMinimizedModules?.boolvalue || false
)

// Methods
const handleModuleNotFound = (moduleName: string, element: DashboardElement) => {
  emit('module-not-found', moduleName, element)
}
</script>

<style scoped>
.dashboard-layout {
  width: 100%;
}
</style>