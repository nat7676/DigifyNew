<template>
  <v-col :cols="12" :md="props.column.md" class="dashboard-column">
    <!-- Render elements in this column -->
    <dashboard-element
      v-for="element in props.column.elements"
      :key="element.uniqueid"
      :element="element"
      :minimized="props.minimizedModules"
      class="mb-4"
      @module-not-found="handleModuleNotFound"
    />
    
    <!-- Render nested sections if any -->
    <dashboard-section
      v-for="section in props.column.sections"
      :key="section.uniqueid"
      :section="section"
      :minimized-modules="props.minimizedModules"
      @module-not-found="handleModuleNotFound"
    />
  </v-col>
</template>

<script setup lang="ts">
import DashboardElement from './DashboardElement.vue'
import DashboardSection from './DashboardSection.vue'

interface DashboardElementType {
  uniqueid: string
  element: string
  Settings?: any[]
  [key: string]: any
}

interface DashboardColumn {
  uniqueid: string
  md: number
  elements: DashboardElementType[]
  sections?: any[]
}

interface Props {
  column: DashboardColumn
  minimizedModules?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minimizedModules: false
})

const emit = defineEmits<{
  'module-not-found': [moduleName: string, element: DashboardElementType]
}>()

const handleModuleNotFound = (moduleName: string, element: DashboardElementType) => {
  emit('module-not-found', moduleName, element)
}
</script>

<style scoped>
.dashboard-column {
  position: relative;
}
</style>