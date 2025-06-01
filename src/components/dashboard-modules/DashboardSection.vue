<template>
  <v-row class="dashboard-section">
    <dashboard-column
      v-for="column in props.section.col"
      :key="column.uniqueid"
      :column="column"
      :minimized-modules="props.minimizedModules"
      @module-not-found="handleModuleNotFound"
    />
  </v-row>
</template>

<script setup lang="ts">
import DashboardColumn from './DashboardColumn.vue'

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

interface Props {
  section: DashboardSection
  minimizedModules?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minimizedModules: false
})

const emit = defineEmits<{
  'module-not-found': [moduleName: string, element: DashboardElement]
}>()

const handleModuleNotFound = (moduleName: string, element: DashboardElement) => {
  emit('module-not-found', moduleName, element)
}
</script>

<style scoped>
.dashboard-section {
  margin-bottom: 16px;
}
</style>