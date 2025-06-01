<template>
  <v-card
    class="module-not-found"
    :elevation="8"
    :height="minimized ? 240 : 400"
  >
    <div class="paradigm-overlay"></div>
    <v-card-text class="d-flex flex-column align-center justify-center h-100 position-relative">
      <div class="gravitas-container">
        <v-icon
          :size="minimized ? 64 : 96"
          :class="['mb-4', 'icon-pulse', minimized ? '' : 'icon-float']"
          color="deep-purple-accent-2"
        >
          mdi-cube-unfolded
        </v-icon>
        
        <h2 :class="['mb-3', minimized ? 'text-h6' : 'text-h4', 'font-weight-bold']">
          <span class="gradient-text">Module Not Available</span>
        </h2>
        
        <p :class="['mb-4', 'text-center', minimized ? 'text-body-2' : 'text-body-1']">
          The module <code class="module-name-enhanced">{{ displayModuleName }}</code> 
          could not be loaded
        </p>
        
        <v-divider class="my-4 divider-glow" />
        
        <div class="help-message">
          <v-icon size="small" class="mr-2" color="amber">mdi-information-outline</v-icon>
          <span class="text-caption font-weight-medium">
            {{ getHelpMessage() }}
          </span>
        </div>
        
        <v-chip
          v-if="!minimized && element?.uniqueid"
          size="small"
          variant="elevated"
          color="deep-purple"
          class="mt-4 chip-holographic"
        >
          <v-icon size="x-small" start>mdi-identifier</v-icon>
          Module ID: {{ element.uniqueid.substring(0, 8) }}...
        </v-chip>
      </div>
      
      <!-- Debug dialog -->
      <v-dialog v-if="!minimized && showDebug && element" v-model="debugDialog" max-width="700">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            color="info"
            class="mt-4"
            prepend-icon="mdi-bug-outline"
          >
            Debug Info
          </v-btn>
        </template>
        <v-card>
          <v-toolbar color="info" density="comfortable">
            <v-icon class="mr-2">mdi-bug</v-icon>
            <v-toolbar-title>Module Debug Information</v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" @click="debugDialog = false"></v-btn>
          </v-toolbar>
          <v-card-text class="pa-0">
            <v-tabs v-model="debugTab" color="info">
              <v-tab value="config">Configuration</v-tab>
              <v-tab value="context">Context</v-tab>
              <v-tab value="raw">Raw Data</v-tab>
            </v-tabs>
            <v-window v-model="debugTab">
              <v-window-item value="config">
                <v-list density="compact">
                  <v-list-item v-if="element.uniqueid">
                    <v-list-item-title>Module ID</v-list-item-title>
                    <v-list-item-subtitle>{{ element.uniqueid }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="element.element">
                    <v-list-item-title>Element Type</v-list-item-title>
                    <v-list-item-subtitle>{{ element.element }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="moduleName">
                    <v-list-item-title>Module Name</v-list-item-title>
                    <v-list-item-subtitle>{{ moduleName }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
              <v-window-item value="context">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Environment</v-list-item-title>
                    <v-list-item-subtitle>{{ environmentMode }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Timestamp</v-list-item-title>
                    <v-list-item-subtitle>{{ new Date().toLocaleString() }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
              <v-window-item value="raw">
                <div class="pa-4">
                  <v-btn 
                    size="small" 
                    variant="text" 
                    color="info" 
                    @click="copyToClipboard"
                    class="mb-2"
                  >
                    <v-icon start>mdi-content-copy</v-icon>
                    Copy JSON
                  </v-btn>
                  <pre class="debug-json">{{ JSON.stringify(element, null, 2) }}</pre>
                </div>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
const environmentMode = computed(() => import.meta.env.MODE)

// Use props in computed to avoid unused variable warning
const displayModuleName = computed(() => props.moduleName || 'Unknown')

// Debug dialog state
const debugDialog = ref(false)
const debugTab = ref('config')

// Copy JSON to clipboard
function copyToClipboard() {
  if (props.element) {
    navigator.clipboard.writeText(JSON.stringify(props.element, null, 2))
  }
}

// Help messages for missing modules
const helpMessages = [
  'This module may not be installed or configured',
  'Check if you have access to this module',
  'The module might be temporarily unavailable',
  'Contact your administrator for module access',
  'This module may require additional permissions',
  'Module configuration might be incomplete',
  'Try refreshing the page to reload modules',
  'Check your system settings for this module'
]

function getHelpMessage(): string {
  const seed = props.moduleName ? props.moduleName.length : 0
  const index = (seed + new Date().getMinutes()) % helpMessages.length
  return helpMessages[index]
}
</script>

<style scoped>
.module-not-found {
  background: 
    radial-gradient(ellipse at top left, rgba(103, 58, 183, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(156, 39, 176, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.module-not-found::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #7c4dff, #b388ff, #7c4dff);
  border-radius: inherit;
  z-index: -1;
  opacity: 0.7;
  animation: borderRotate 6s linear infinite;
}

@keyframes borderRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.paradigm-overlay {
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(124, 77, 255, 0.03) 10px,
      rgba(124, 77, 255, 0.03) 20px
    );
  pointer-events: none;
}

.gravitas-container {
  text-align: center;
  z-index: 1;
}

.icon-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.icon-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(5deg); }
  66% { transform: translateY(-5px) rotate(-5deg); }
}

.gradient-text {
  background: linear-gradient(45deg, #7c4dff, #b388ff, #e91e63, #ff6090);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(124, 77, 255, 0.5);
}

.tracking-wide {
  letter-spacing: 0.15em;
}

.module-name-enhanced {
  background: linear-gradient(135deg, #7c4dff 0%, #b388ff 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 4px 15px rgba(124, 77, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.divider-glow {
  max-width: 200px;
  border-color: rgba(179, 136, 255, 0.5);
  box-shadow: 0 0 10px rgba(124, 77, 255, 0.5);
}

.help-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 24px;
  border: 1px solid rgba(255, 193, 7, 0.2);
  color: #ffc107;
  max-width: 90%;
  margin: 0 auto;
  backdrop-filter: blur(10px);
}

.chip-holographic {
  background: linear-gradient(45deg, #673ab7, #9c27b0, #673ab7) !important;
  animation: holographic 3s ease-in-out infinite;
}

@keyframes holographic {
  0%, 100% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(30deg) brightness(1.2); }
}

.debug-json {
  background: #f5f5f5;
  color: #333;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
  border: 1px solid #e0e0e0;
}

pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
}
</style>