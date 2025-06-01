<template>
  <component
    :is="moduleComponent"
    v-if="moduleComponent"
    :element="element"
    :settings="parsedSettings"
    :minimized="minimized"
  />
  <module-not-found
    v-else
    :module-name="element.element"
    :element="element"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import ModuleNotFound from './ModuleNotFound.vue'

interface DashboardElement {
  uniqueid: string
  element: string
  Settings?: any[]
  [key: string]: any
}

interface Props {
  element: DashboardElement
  minimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minimized: false
})

const emit = defineEmits<{
  'module-not-found': [moduleName: string, element: DashboardElement]
}>()

// Module registry - will be expanded as modules are created
const moduleRegistry: Record<string, () => Promise<Component>> = {
  // Currently implemented modules
  wergelandOrders: () => import('./modules/WergelandOrders.vue'),
  InfoBox: () => import('./modules/InfoBox.vue'),
  ImageBox: () => import('./modules/ImageBox.vue'),
  TodoList: () => import('./modules/TodoList.vue'),
  ProjectUserStatus: () => import('./modules/ProjectUserStatus.vue'),
  Carousel: () => import('./modules/Carousel.vue'),
  
  // System modules
  DashboardNotFound: () => import('./DashboardNotFound.vue'),
  
  // Add more modules as they are created
  // Example of how to add new modules:
  // InfoBoxRich: () => import('./modules/InfoBoxRich.vue'),
  // companyInfo: () => import('./modules/CompanyInfo.vue'),
  // contractList: () => import('./modules/ContractList.vue'),
  // documentList: () => import('./modules/DocumentList.vue'),
}

// Computed properties
const moduleComponent = computed(() => {
  const moduleName = props.element.element
  
  if (!moduleName || !moduleRegistry[moduleName]) {
    // Emit event when module not found
    emit('module-not-found', moduleName, props.element)
    return null
  }
  
  // Return async component
  return defineAsyncComponent({
    loader: moduleRegistry[moduleName],
    errorComponent: ModuleNotFound,
    onError: (error) => {
      console.error(`Failed to load module ${moduleName}:`, error)
      emit('module-not-found', moduleName, props.element)
    }
  })
})

const parsedSettings = computed(() => {
  // Parse settings array into a more usable format
  const settings: Record<string, any> = {}
  
  if (props.element.Settings && Array.isArray(props.element.Settings)) {
    props.element.Settings.forEach((setting: any) => {
      if (setting.ObjectType !== undefined && setting.ObjectID !== undefined) {
        settings[`object_${setting.ObjectType}`] = setting.ObjectID
      }
    })
  }
  
  // Include any additional properties from the element
  Object.keys(props.element).forEach(key => {
    if (key !== 'uniqueid' && key !== 'element' && key !== 'Settings') {
      settings[key] = props.element[key]
    }
  })
  
  return settings
})
</script>

<style scoped>
/* Styles will be added as needed */
</style>