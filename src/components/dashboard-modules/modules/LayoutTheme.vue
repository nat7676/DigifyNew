<template>
  <DashboardCard 
    :element="element"
  >
    <div class="pa-4">
      <!-- Theme Preview -->
      <div class="theme-preview mb-4">
        <v-row>
          <v-col 
            v-for="(color, name) in currentThemeColors" 
            :key="name"
            cols="6"
            sm="4"
            md="3"
          >
            <div 
              class="color-swatch"
              :style="{ backgroundColor: color }"
              @click="selectedColor = name"
            >
              <span class="color-label">{{ name }}</span>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Action Button -->
      <v-btn
        color="primary"
        variant="flat"
        block
        size="large"
        prepend-icon="mdi-palette"
        @click="showDialog = true"
      >
        {{ settings.buttonText || 'Customize Theme' }}
      </v-btn>
    </div>

    <!-- Theme Editor Dialog -->
    <v-dialog 
      v-model="showDialog" 
      :max-width="settings.dialogWidth || 800"
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start>mdi-palette</v-icon>
          Theme Editor
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDialog = false"
          />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab">
            <v-tab value="presets">
              <v-icon start>mdi-palette-swatch</v-icon>
              Presets
            </v-tab>
            <v-tab value="custom">
              <v-icon start>mdi-tune</v-icon>
              Custom Colors
            </v-tab>
            <v-tab value="advanced">
              <v-icon start>mdi-code-braces</v-icon>
              Advanced
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Presets Tab -->
            <v-window-item value="presets">
              <v-container>
                <p class="text-body-2 mb-4">
                  Select a preset theme to quickly change your application's look
                </p>
                <v-row>
                  <v-col
                    v-for="preset in themePresets"
                    :key="preset.name"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      :variant="selectedPreset === preset.name ? 'tonal' : 'outlined'"
                      @click="applyPreset(preset)"
                    >
                      <v-card-text>
                        <div class="preset-name text-subtitle-2 mb-2">
                          {{ preset.name }}
                        </div>
                        <div class="preset-colors">
                          <div
                            v-for="(color, key) in preset.colors"
                            :key="key"
                            class="preset-color"
                            :style="{ backgroundColor: color }"
                            :title="key"
                          />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>

            <!-- Custom Colors Tab -->
            <v-window-item value="custom">
              <v-container>
                <v-row>
                  <v-col
                    v-for="(color, name) in editableColors"
                    :key="name"
                    cols="12"
                    sm="6"
                  >
                    <v-text-field
                      v-model="editableColors[name]"
                      :label="formatColorName(name)"
                      variant="outlined"
                      density="compact"
                      hide-details
                    >
                      <template #prepend>
                        <v-menu
                          :close-on-content-click="false"
                          location="top"
                        >
                          <template v-slot:activator="{ props }">
                            <div
                              class="color-picker-trigger"
                              :style="{ backgroundColor: editableColors[name] }"
                              v-bind="props"
                            />
                          </template>
                          <v-color-picker
                            v-model="editableColors[name]"
                            :modes="['hex', 'rgb', 'hsl']"
                            show-swatches
                          />
                        </v-menu>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>

            <!-- Advanced Tab -->
            <v-window-item value="advanced">
              <v-container>
                <v-alert
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  Advanced theme settings allow you to customize CSS variables and other theme properties
                </v-alert>

                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      CSS Variables
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col
                          v-for="(value, name) in cssVariables"
                          :key="name"
                          cols="12"
                          sm="6"
                        >
                          <v-text-field
                            v-model="cssVariables[name]"
                            :label="name"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="mb-2"
                          />
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      Export/Import
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-textarea
                        v-model="themeJson"
                        label="Theme JSON"
                        variant="outlined"
                        rows="10"
                        class="mb-3"
                      />
                      <v-row>
                        <v-col>
                          <v-btn
                            variant="tonal"
                            block
                            @click="exportTheme"
                          >
                            Export Theme
                          </v-btn>
                        </v-col>
                        <v-col>
                          <v-btn
                            variant="tonal"
                            block
                            @click="importTheme"
                          >
                            Import Theme
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-container>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-btn
            variant="text"
            @click="resetTheme"
          >
            Reset to Default
          </v-btn>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveTheme"
          >
            Save Theme
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Mode Settings -->
    <template #editcontent v-if="element.EditMode">
      <div class="pa-4">
        <p class="text-subtitle-2 mb-3">Theme Module Settings</p>
        
        <TextField
          v-model="settings.buttonText"
          label="Button Text"
          placeholder="Customize Theme"
          class="mb-3"
        />
        
        <v-select
          v-model="settings.dialogWidth"
          label="Dialog Width"
          :items="[600, 700, 800, 900, 1000]"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        
        <CheckBox
          v-model="settings.showPreview"
          label="Show color preview in card"
          class="mb-2"
        />
        
        <CheckBox
          v-model="settings.allowSystemSave"
          label="Save theme at system level"
          hint="When enabled, theme changes affect all users"
        />
      </div>
    </template>
  </DashboardCard>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import DashboardCard from '@/components/ui/DashboardCard.vue'
import TextField from '@/components/ui/TextField.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import { useUIStore } from '@/stores/ui'
import { executeSQLQueryWithCallback } from '@/services/sql.service'

interface LayoutThemeSettings {
  buttonText: string
  dialogWidth: number
  showPreview: boolean
  allowSystemSave: boolean
}

interface ThemePreset {
  name: string
  colors: Record<string, string>
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  LayoutTheme?: LayoutThemeSettings
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()
const theme = useTheme()
const uiStore = useUIStore()

// State
const showDialog = ref(false)
const activeTab = ref('presets')
const selectedPreset = ref('')
const selectedColor = ref('')
const editableColors = ref<Record<string, string>>({})
const cssVariables = ref<Record<string, string>>({})
const themeJson = ref('')

// Initialize settings
const getSettings = (): LayoutThemeSettings => {
  if (!props.element.LayoutTheme) {
    const defaultSettings: LayoutThemeSettings = {
      buttonText: 'Customize Theme',
      dialogWidth: 800,
      showPreview: true,
      allowSystemSave: true
    }
    props.element.LayoutTheme = defaultSettings
  }
  return props.element.LayoutTheme
}

const settings = reactive(getSettings())

// Theme presets
const themePresets: ThemePreset[] = [
  {
    name: 'Default Blue',
    colors: {
      primary: '#1976D2',
      secondary: '#424242',
      accent: '#82B1FF',
      error: '#FF5252',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FB8C00'
    }
  },
  {
    name: 'Teal & Orange',
    colors: {
      primary: '#009688',
      secondary: '#FF6F00',
      accent: '#00BCD4',
      error: '#FF5252',
      info: '#00ACC1',
      success: '#00C853',
      warning: '#FFB300'
    }
  },
  {
    name: 'Purple & Pink',
    colors: {
      primary: '#9C27B0',
      secondary: '#E91E63',
      accent: '#E040FB',
      error: '#FF5252',
      info: '#BA68C8',
      success: '#4CAF50',
      warning: '#FFA726'
    }
  },
  {
    name: 'Dark Professional',
    colors: {
      primary: '#263238',
      secondary: '#37474F',
      accent: '#546E7A',
      error: '#EF5350',
      info: '#42A5F5',
      success: '#66BB6A',
      warning: '#FFA726'
    }
  },
  {
    name: 'Green Nature',
    colors: {
      primary: '#2E7D32',
      secondary: '#558B2F',
      accent: '#8BC34A',
      error: '#D32F2F',
      info: '#0288D1',
      success: '#388E3C',
      warning: '#F57C00'
    }
  },
  {
    name: 'Red Energy',
    colors: {
      primary: '#D32F2F',
      secondary: '#C62828',
      accent: '#FF5252',
      error: '#B71C1C',
      info: '#0288D1',
      success: '#388E3C',
      warning: '#F57C00'
    }
  }
]

// Get current theme colors
const currentThemeColors = computed(() => {
  const currentTheme = theme.current.value
  return currentTheme.colors || {}
})

// Format color name for display
const formatColorName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Apply preset theme
const applyPreset = (preset: ThemePreset) => {
  selectedPreset.value = preset.name
  editableColors.value = { ...preset.colors }
  
  // Apply to current theme immediately for preview
  Object.entries(preset.colors).forEach(([key, value]) => {
    if (theme.current.value.colors) {
      theme.current.value.colors[key] = value
    }
  })
}

// Load current theme into editor
const loadCurrentTheme = () => {
  const colors = theme.current.value.colors
  if (colors) {
    editableColors.value = { ...colors }
  }
  
  // Load CSS variables
  cssVariables.value = {
    '--v-border-color': getComputedStyle(document.documentElement).getPropertyValue('--v-border-color').trim() || '#E0E0E0',
    '--v-theme-overlay-multiplier': '1',
    '--v-high-emphasis-opacity': '0.87',
    '--v-medium-emphasis-opacity': '0.60',
    '--v-disabled-opacity': '0.38'
  }
}

// Export theme as JSON
const exportTheme = () => {
  const themeData = {
    name: 'Custom Theme',
    colors: editableColors.value,
    variables: cssVariables.value,
    dark: theme.current.value.dark
  }
  themeJson.value = JSON.stringify(themeData, null, 2)
}

// Import theme from JSON
const importTheme = () => {
  try {
    const themeData = JSON.parse(themeJson.value)
    if (themeData.colors) {
      editableColors.value = themeData.colors
      applyPreset({
        name: themeData.name || 'Imported',
        colors: themeData.colors
      })
    }
    if (themeData.variables) {
      cssVariables.value = themeData.variables
    }
    uiStore.showSuccess('Theme imported successfully')
  } catch (error) {
    uiStore.showError('Invalid theme JSON')
  }
}

// Reset to default theme
const resetTheme = () => {
  const defaultPreset = themePresets[0]
  applyPreset(defaultPreset)
  loadCurrentTheme()
}

// Save theme
const saveTheme = async () => {
  try {
    // Apply theme changes
    Object.entries(editableColors.value).forEach(([key, value]) => {
      if (theme.current.value.colors) {
        theme.current.value.colors[key] = value
      }
    })
    
    // Apply CSS variables
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
    
    // Save to localStorage for persistence
    const themeData = {
      colors: editableColors.value,
      variables: cssVariables.value,
      dark: theme.current.value.dark
    }
    localStorage.setItem('customTheme', JSON.stringify(themeData))
    
    // Save to system if enabled
    if (settings.allowSystemSave) {
      try {
        await executeSQLQueryWithCallback(
          '/components/LayoutTheme/SaveSystemTheme',
          { 
            ThemeData: JSON.stringify(themeData)
          }
        )
        uiStore.showSuccess('Theme saved to system')
      } catch (error) {
        console.error('Failed to save system theme:', error)
        uiStore.showWarning('Theme saved locally only')
      }
    }
    
    showDialog.value = false
    uiStore.showSuccess('Theme applied successfully')
  } catch (error) {
    console.error('Failed to save theme:', error)
    uiStore.showError('Failed to save theme')
  }
}

// Load saved theme on mount
const loadSavedTheme = () => {
  const savedTheme = localStorage.getItem('customTheme')
  if (savedTheme) {
    try {
      const themeData = JSON.parse(savedTheme)
      if (themeData.colors) {
        editableColors.value = themeData.colors
        Object.entries(themeData.colors).forEach(([key, value]) => {
          if (theme.current.value.colors) {
            theme.current.value.colors[key] = value as string
          }
        })
      }
      if (themeData.variables) {
        cssVariables.value = themeData.variables
        Object.entries(themeData.variables).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value as string)
        })
      }
    } catch (error) {
      console.error('Failed to load saved theme:', error)
    }
  }
}

// Watch for settings changes
watch(settings, (newSettings) => {
  props.element.LayoutTheme = { ...newSettings }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadCurrentTheme()
  loadSavedTheme()
})
</script>

<style scoped>
.theme-preview {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

:deep(.v-theme--dark) .theme-preview {
  background-color: rgba(255, 255, 255, 0.02);
}

.color-swatch {
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.color-swatch:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.color-label {
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  background-color: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.preset-colors {
  display: flex;
  gap: 4px;
}

.preset-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.preset-name {
  font-weight: 500;
  margin-bottom: 8px;
}

.color-picker-trigger {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.color-picker-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.v-theme--dark) .color-picker-trigger {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>