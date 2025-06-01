<template>
  <Card 
    :title="element.title || 'Image Box'"
    :show-title="element.showHeader !== false"
    :dense="true"
    :no-padding="true"
  >
    <!-- Image Display -->
    <div v-if="imageSettings.imageSrc" class="image-container">
      <v-img
        :src="imageSettings.imageSrc"
        :alt="imageSettings.altText || element.title"
        :aspect-ratio="imageSettings.aspectRatio"
        :cover="imageSettings.fitMode === 'cover'"
        :contain="imageSettings.fitMode === 'contain'"
        :max-height="imageSettings.maxHeight"
        class="dashboard-image"
        @click="showFullscreen = true"
      >
        <template v-slot:placeholder>
          <v-row
            class="fill-height ma-0"
            align="center"
            justify="center"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </v-row>
        </template>
        
        <!-- Hover Overlay -->
        <div class="image-overlay">
          <v-btn
            icon="mdi-fullscreen"
            size="small"
            color="white"
            class="ma-2"
            @click.stop="showFullscreen = true"
          />
        </div>
      </v-img>
      
      <!-- Image Caption -->
      <div v-if="imageSettings.caption" class="image-caption">
        {{ imageSettings.caption }}
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-image-off-outline
      </v-icon>
      <p class="text-body-1 text-grey-darken-1 mb-4">
        No image selected
      </p>
      <v-btn
        v-if="!isEditMode"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-image-plus"
        @click="isEditMode = true"
      >
        Add Image
      </v-btn>
    </div>
    
    <!-- Edit Mode -->
    <template v-if="isEditMode">
      <v-divider />
      <div class="edit-controls pa-4">
        <!-- Image Source Section -->
        <div class="mb-4">
          <p class="text-subtitle-2 mb-2">Image Source</p>
          <v-tabs v-model="imageSourceTab" density="compact" class="mb-4">
            <v-tab value="url">URL</v-tab>
            <v-tab value="upload" disabled>
              Upload
              <v-chip size="x-small" class="ml-2">Coming Soon</v-chip>
            </v-tab>
          </v-tabs>
          
          <v-window v-model="imageSourceTab">
            <v-window-item value="url">
              <TextField
                v-model="imageSettings.imageSrc"
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                prepend-inner-icon="mdi-link"
                clearable
                :rules="[rules.url]"
              />
            </v-window-item>
            
            <v-window-item value="upload">
              <!-- File upload will be implemented later -->
              <div class="text-center pa-4 text-grey">
                File upload functionality coming soon
              </div>
            </v-window-item>
          </v-window>
        </div>
        
        <!-- Display Settings -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-tune</v-icon>
              Display Settings
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pt-2">
                <!-- Alt Text -->
                <TextField
                  v-model="imageSettings.altText"
                  label="Alt Text"
                  placeholder="Describe the image for accessibility"
                  class="mb-3"
                />
                
                <!-- Caption -->
                <TextField
                  v-model="imageSettings.caption"
                  label="Caption"
                  placeholder="Optional caption below image"
                  class="mb-3"
                />
                
                <!-- Fit Mode -->
                <v-radio-group
                  v-model="imageSettings.fitMode"
                  label="Image Fit Mode"
                  inline
                  class="mb-3"
                >
                  <v-radio label="Cover (fill area)" value="cover" />
                  <v-radio label="Contain (fit inside)" value="contain" />
                  <v-radio label="Natural size" value="none" />
                </v-radio-group>
                
                <!-- Max Height -->
                <TextField
                  v-model="imageSettings.maxHeight"
                  label="Maximum Height (pixels)"
                  type="number"
                  placeholder="e.g., 400"
                  class="mb-3"
                />
                
                <!-- Aspect Ratio -->
                <v-select
                  v-model="imageSettings.aspectRatio"
                  :items="aspectRatioOptions"
                  label="Aspect Ratio"
                  clearable
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-eye</v-icon>
              Visual Effects
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pt-2">
                <!-- Border Radius -->
                <v-slider
                  v-model="imageSettings.borderRadius"
                  label="Border Radius"
                  :max="50"
                  :step="1"
                  thumb-label
                  class="mb-3"
                >
                  <template v-slot:append>
                    <span class="text-caption">{{ imageSettings.borderRadius }}px</span>
                  </template>
                </v-slider>
                
                <!-- Shadow -->
                <CheckBox
                  v-model="imageSettings.showShadow"
                  label="Show shadow"
                  class="mb-3"
                />
                
                <!-- Hover Effects -->
                <CheckBox
                  v-model="imageSettings.enableHoverEffects"
                  label="Enable hover effects"
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        
        <!-- Preview -->
        <div v-if="imageSettings.imageSrc" class="preview-section">
          <p class="text-subtitle-2 mb-2">Preview</p>
          <v-sheet 
            color="grey-lighten-4" 
            rounded 
            class="pa-4 preview-container"
          >
            <v-img
              :src="imageSettings.imageSrc"
              :aspect-ratio="imageSettings.aspectRatio"
              :cover="imageSettings.fitMode === 'cover'"
              :contain="imageSettings.fitMode === 'contain'"
              :max-height="200"
              :style="{
                borderRadius: imageSettings.borderRadius + 'px',
                boxShadow: imageSettings.showShadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
              }"
            />
          </v-sheet>
        </div>
      </div>
    </template>
    
    <!-- Fullscreen Dialog -->
    <v-dialog
      v-model="showFullscreen"
      fullscreen
      transition="dialog-bottom-transition"
      :scrim="true"
      class="image-fullscreen-dialog"
    >
      <v-card color="black">
        <v-toolbar
          dark
          color="transparent"
          flat
        >
          <v-toolbar-title>{{ element.title || 'Image' }}</v-toolbar-title>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            @click="showFullscreen = false"
          />
        </v-toolbar>
        
        <v-container fluid class="fill-height pa-0">
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-img
              :src="imageSettings.imageSrc"
              contain
              :max-height="windowHeight - 100"
              :max-width="windowWidth - 100"
            />
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import Card from '@/components/ui/Card.vue'
import TextField from '@/components/ui/TextField.vue'
import CheckBox from '@/components/ui/CheckBox.vue'

interface ImageBoxSettings {
  imageSrc: string
  altText: string
  caption: string
  fitMode: 'cover' | 'contain' | 'none'
  maxHeight: string
  aspectRatio: string | undefined
  borderRadius: number
  showShadow: boolean
  enableHoverEffects: boolean
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  ImageBox?: ImageBoxSettings
  imageSrc?: string
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()

// Window dimensions for fullscreen
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// State
const showFullscreen = ref(false)
const imageSourceTab = ref('url')

// Initialize settings
const getSettings = (): ImageBoxSettings => {
  if (!props.element.ImageBox) {
    // Initialize with default values or migrate from old properties
    const defaultSettings: ImageBoxSettings = {
      imageSrc: props.element.imageSrc || '',
      altText: '',
      caption: '',
      fitMode: 'cover',
      maxHeight: '400',
      aspectRatio: undefined,
      borderRadius: 8,
      showShadow: true,
      enableHoverEffects: true
    }
    
    // Store the settings back in the element
    props.element.ImageBox = defaultSettings
  }
  return props.element.ImageBox
}

const imageSettings = reactive(getSettings())

// Check if in edit mode
const isEditMode = computed({
  get: () => props.element.EditMode || false,
  set: (value) => {
    props.element.EditMode = value
  }
})

// Validation rules
const rules = {
  url: (v: string) => !v || /^https?:\/\/.+/.test(v) || 'Please enter a valid URL'
}

// Aspect ratio options
const aspectRatioOptions = [
  { title: 'Square (1:1)', value: '1' },
  { title: 'Landscape (16:9)', value: '1.778' },
  { title: 'Landscape (4:3)', value: '1.333' },
  { title: 'Portrait (3:4)', value: '0.75' },
  { title: 'Portrait (9:16)', value: '0.563' },
  { title: 'Wide (21:9)', value: '2.333' },
  { title: 'Auto', value: undefined }
]

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Watch for external image source changes
watch(() => props.element.imageSrc, (newSrc) => {
  if (newSrc && newSrc !== imageSettings.imageSrc) {
    imageSettings.imageSrc = newSrc
  }
})

// Save settings back to element when they change
watch(imageSettings, (newSettings) => {
  props.element.ImageBox = { ...newSettings }
}, { deep: true })

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.image-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.dashboard-image {
  transition: transform 0.3s ease;
}

.image-container:hover .dashboard-image {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.image-overlay > * {
  pointer-events: auto;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.image-caption {
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.03);
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.7);
}

:deep(.v-theme--dark) .image-caption {
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.edit-controls {
  background-color: rgba(0, 0, 0, 0.02);
}

:deep(.v-theme--dark) .edit-controls {
  background-color: rgba(255, 255, 255, 0.02);
}

.preview-section {
  margin-top: 16px;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

/* Fullscreen dialog styles */
.image-fullscreen-dialog :deep(.v-overlay__content) {
  background: black !important;
}
</style>