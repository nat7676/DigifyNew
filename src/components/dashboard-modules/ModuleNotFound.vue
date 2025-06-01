<template>
  <v-card
    class="module-not-found"
    :elevation="2"
    :height="minimized ? 200 : 300"
  >
    <v-card-text class="d-flex flex-column align-center justify-center h-100">
      <v-icon
        :size="minimized ? 48 : 64"
        color="grey-lighten-1"
        class="mb-4"
      >
        mdi-puzzle-outline
      </v-icon>
      
      <h3 class="text-h6 text-grey-darken-1 mb-2">
        Module Not Found
      </h3>
      
      <p class="text-body-2 text-grey text-center mb-4">
        <code class="module-name">{{ displayModuleName }}</code>
      </p>
      
      <v-chip
        v-if="!minimized && element?.uniqueid"
        size="x-small"
        variant="tonal"
        color="grey"
      >
        ID: {{ element.uniqueid.substring(0, 8) }}...
      </v-chip>
      
      <!-- Debug info in development -->
      <v-expansion-panels
        v-if="!minimized && showDebug && element"
        class="mt-4"
        variant="accordion"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon size="small" class="mr-2">mdi-bug</v-icon>
            Debug Info
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="text-caption">{{ JSON.stringify(element, null, 2) }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  moduleName?: string
  element?: {
    uniqueid: string
    element: string
    [key: string]: any
  }
  minimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  moduleName: 'Unknown',
  minimized: false
})

const showDebug = computed(() => import.meta.env.DEV)

// Use props in computed to avoid unused variable warning
const displayModuleName = computed(() => props.moduleName || 'Unknown')
</script>

<style scoped>
.module-not-found {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border: 2px dashed #bdbdbd;
}

.module-name {
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #616161;
}

pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
}
</style>