<template>
  <Card 
    :title="element.Title || element.title || 'Image Carousel'"
    :show-title="element.showHeader !== false"
    :no-padding="true"
    :dense="true"
  >
    <!-- Carousel Display -->
    <div v-if="carouselSettings.images.length > 0" class="carousel-wrapper">
      <v-carousel
        v-model="currentSlide"
        :height="carouselHeight"
        :show-arrows="carouselSettings.showArrows"
        :hide-delimiter-background="true"
        :hide-delimiters="carouselSettings.hideIndicators"
        :cycle="carouselSettings.autoPlay"
        :interval="carouselSettings.interval"
        class="dashboard-carousel"
      >
        <v-carousel-item
          v-for="(image, index) in carouselSettings.images"
          :key="image.id"
        >
          <div class="carousel-slide">
            <v-img
              :src="image.src"
              :alt="image.alt || `Slide ${index + 1}`"
              :height="carouselHeight"
              :cover="carouselSettings.imageFit === 'cover'"
              :contain="carouselSettings.imageFit === 'contain'"
              class="carousel-image"
              :eager="index === 0"
              @click="openLightbox(index)"
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
              
              <!-- Image Overlay -->
              <div v-if="image.caption" class="image-caption">
                <div class="caption-content">
                  <h3 v-if="image.title" class="text-h6 mb-1">{{ image.title }}</h3>
                  <p class="text-body-2 mb-0">{{ image.caption }}</p>
                </div>
              </div>
              
              <!-- Zoom Icon -->
              <v-btn
                icon="mdi-magnify-plus"
                size="small"
                color="white"
                variant="flat"
                class="zoom-button"
                @click.stop="openLightbox(index)"
              />
            </v-img>
          </div>
        </v-carousel-item>
      </v-carousel>
      
      <!-- Thumbnail Navigation -->
      <div v-if="carouselSettings.showThumbnails && carouselSettings.images.length > 1" class="thumbnail-nav">
        <v-sheet color="transparent" class="thumbnail-container">
          <div class="thumbnail-scroll">
            <div
              v-for="(image, index) in carouselSettings.images"
              :key="image.id"
              class="thumbnail-item"
              :class="{ active: currentSlide === index }"
              @click="currentSlide = index"
            >
              <v-img
                :src="image.src"
                :alt="`Thumbnail ${index + 1}`"
                cover
                height="60"
                width="80"
                class="thumbnail-image"
              />
            </div>
          </div>
        </v-sheet>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-image-multiple-outline
      </v-icon>
      <p class="text-h6 text-grey-darken-1 mb-4">
        No images in carousel
      </p>
      <p class="text-body-2 text-grey mb-4">
        Add images to create a beautiful carousel
      </p>
      <v-btn
        v-if="!isEditMode"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-image-plus"
        @click="isEditMode = true"
      >
        Add Images
      </v-btn>
    </div>
    
    <!-- Edit Mode -->
    <template v-if="isEditMode">
      <v-divider />
      <div class="edit-controls pa-4">
        <!-- Image Management -->
        <div class="mb-6">
          <div class="d-flex align-center mb-3">
            <p class="text-subtitle-1 mb-0">Images</p>
            <v-spacer />
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-image-plus"
              @click="showImageDialog = true"
            >
              Add Image
            </v-btn>
          </div>
          
          <!-- Image List -->
          <draggable
            v-if="carouselSettings.images.length > 0"
            v-model="carouselSettings.images"
            item-key="id"
            handle=".drag-handle"
            class="image-list"
          >
            <template #item="{ element, index }">
              <v-card variant="outlined" class="mb-2">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon class="drag-handle">mdi-drag</v-icon>
                    <v-img
                      :src="element.src"
                      width="60"
                      height="40"
                      cover
                      class="mr-3 rounded"
                    />
                  </template>
                  
                  <v-list-item-title>
                    {{ element.title || `Image ${index + 1}` }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="element.caption">
                    {{ element.caption }}
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="editImage(element)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeImage(element.id)"
                    />
                  </template>
                </v-list-item>
              </v-card>
            </template>
          </draggable>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            density="compact"
          >
            No images added yet
          </v-alert>
        </div>
        
        <!-- Carousel Settings -->
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-cog</v-icon>
              Display Settings
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pt-2">
                <!-- Height Mode -->
                <v-radio-group
                  v-model="carouselSettings.heightMode"
                  label="Height Mode"
                  inline
                  class="mb-3"
                >
                  <v-radio label="Auto" value="auto" />
                  <v-radio label="Fixed" value="fixed" />
                  <v-radio label="Responsive" value="responsive" />
                </v-radio-group>
                
                <!-- Fixed Height -->
                <TextField
                  v-if="carouselSettings.heightMode === 'fixed'"
                  v-model.number="carouselSettings.fixedHeight"
                  label="Height (pixels)"
                  type="number"
                  :min="200"
                  :max="800"
                  class="mb-3"
                />
                
                <!-- Image Fit -->
                <v-select
                  v-model="carouselSettings.imageFit"
                  :items="imageFitOptions"
                  label="Image Fit"
                  class="mb-3"
                />
                
                <!-- Show Options -->
                <CheckBox
                  v-model="carouselSettings.showArrows"
                  label="Show navigation arrows"
                  class="mb-2"
                />
                
                <CheckBox
                  v-model="carouselSettings.showIndicators"
                  label="Show slide indicators"
                  :disabled="carouselSettings.hideIndicators"
                  class="mb-2"
                />
                
                <CheckBox
                  v-model="carouselSettings.showThumbnails"
                  label="Show thumbnail navigation"
                  class="mb-2"
                />
                
                <CheckBox
                  v-model="carouselSettings.enableLightbox"
                  label="Enable lightbox on click"
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-play</v-icon>
              Autoplay Settings
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pt-2">
                <CheckBox
                  v-model="carouselSettings.autoPlay"
                  label="Enable autoplay"
                  class="mb-3"
                />
                
                <v-slider
                  v-if="carouselSettings.autoPlay"
                  v-model="carouselSettings.interval"
                  label="Interval (seconds)"
                  :min="2000"
                  :max="10000"
                  :step="500"
                  thumb-label
                  class="mb-3"
                >
                  <template v-slot:append>
                    <span class="text-caption">{{ (carouselSettings.interval / 1000).toFixed(1) }}s</span>
                  </template>
                </v-slider>
                
                <CheckBox
                  v-if="carouselSettings.autoPlay"
                  v-model="carouselSettings.pauseOnHover"
                  label="Pause on hover"
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-transition</v-icon>
              Transition Effects
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pt-2">
                <v-select
                  v-model="carouselSettings.transition"
                  :items="transitionOptions"
                  label="Transition effect"
                  class="mb-3"
                />
                
                <v-slider
                  v-model="carouselSettings.transitionDuration"
                  label="Transition duration"
                  :min="300"
                  :max="1500"
                  :step="100"
                  thumb-label
                >
                  <template v-slot:append>
                    <span class="text-caption">{{ carouselSettings.transitionDuration }}ms</span>
                  </template>
                </v-slider>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
    
    <!-- Image Dialog -->
    <v-dialog v-model="showImageDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingImage ? 'Edit Image' : 'Add Image' }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="closeImageDialog"
          />
        </v-card-title>
        <v-divider />
        
        <v-card-text class="pa-4">
          <v-tabs v-model="imageSourceTab" class="mb-4">
            <v-tab value="url">URL</v-tab>
            <v-tab value="upload" disabled>
              Upload
              <v-chip size="x-small" class="ml-2">Coming Soon</v-chip>
            </v-tab>
          </v-tabs>
          
          <v-window v-model="imageSourceTab">
            <v-window-item value="url">
              <v-text-field
                v-model="imageForm.src"
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                variant="outlined"
                density="compact"
                :rules="[rules.required, rules.url]"
                class="mb-3"
              />
            </v-window-item>
          </v-window>
          
          <v-text-field
            v-model="imageForm.title"
            label="Title (optional)"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          
          <v-textarea
            v-model="imageForm.caption"
            label="Caption (optional)"
            variant="outlined"
            density="compact"
            rows="2"
            class="mb-3"
          />
          
          <v-text-field
            v-model="imageForm.alt"
            label="Alt text (for accessibility)"
            variant="outlined"
            density="compact"
            placeholder="Describe the image"
          />
          
          <!-- Preview -->
          <div v-if="imageForm.src && isValidUrl(imageForm.src)" class="mt-4">
            <p class="text-subtitle-2 mb-2">Preview</p>
            <v-img
              :src="imageForm.src"
              :alt="imageForm.alt"
              height="200"
              contain
              class="preview-image rounded"
            />
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeImageDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="text"
            :disabled="!imageForm.src || !isValidUrl(imageForm.src)"
            @click="saveImage"
          >
            {{ editingImage ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Lightbox -->
    <v-dialog
      v-model="showLightbox"
      fullscreen
      transition="fade-transition"
      class="lightbox-dialog"
    >
      <v-card color="black" flat>
        <v-toolbar
          color="transparent"
          dark
          flat
        >
          <v-toolbar-title>
            {{ lightboxImage?.title || 'Image' }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            @click="showLightbox = false"
          />
        </v-toolbar>
        
        <v-carousel
          v-model="lightboxIndex"
          height="100%"
          :show-arrows="carouselSettings.images.length > 1"
          hide-delimiter-background
          :hide-delimiters="false"
          class="lightbox-carousel"
        >
          <v-carousel-item
            v-for="(image, index) in carouselSettings.images"
            :key="image.id"
          >
            <v-container fluid class="fill-height pa-0">
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-img
                  :src="image.src"
                  :alt="image.alt"
                  contain
                  max-height="90vh"
                  max-width="90vw"
                />
              </v-row>
            </v-container>
            
            <div v-if="image.caption" class="lightbox-caption">
              <h3 v-if="image.title" class="text-h5 mb-2">{{ image.title }}</h3>
              <p class="text-body-1">{{ image.caption }}</p>
            </div>
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import Card from '@/components/ui/Card.vue'
import TextField from '@/components/ui/TextField.vue'
import CheckBox from '@/components/ui/CheckBox.vue'

interface CarouselImage {
  id: string
  src: string
  title?: string
  caption?: string
  alt?: string
}

interface CarouselSettings {
  images: CarouselImage[]
  heightMode: 'auto' | 'fixed' | 'responsive'
  fixedHeight: number
  imageFit: 'cover' | 'contain' | 'none'
  showArrows: boolean
  showIndicators: boolean
  hideIndicators: boolean
  showThumbnails: boolean
  enableLightbox: boolean
  autoPlay: boolean
  interval: number
  pauseOnHover: boolean
  transition: string
  transitionDuration: number
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  Carousel?: CarouselSettings
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()

// State
const currentSlide = ref(0)
const showImageDialog = ref(false)
const showLightbox = ref(false)
const lightboxIndex = ref(0)
const imageSourceTab = ref('url')
const editingImage = ref<CarouselImage | null>(null)

// Initialize settings
const getSettings = (): CarouselSettings => {
  if (!props.element.Carousel) {
    const defaultSettings: CarouselSettings = {
      images: [],
      heightMode: 'responsive',
      fixedHeight: 400,
      imageFit: 'cover',
      showArrows: true,
      showIndicators: true,
      hideIndicators: false,
      showThumbnails: false,
      enableLightbox: true,
      autoPlay: true,
      interval: 5000,
      pauseOnHover: true,
      transition: 'fade',
      transitionDuration: 500
    }
    props.element.Carousel = defaultSettings
  }
  
  // Handle old data structure migration
  const carousel = props.element.Carousel as any
  if (carousel.Carousel && Array.isArray(carousel.Carousel)) {
    // Migrate from old structure
    const migratedImages: CarouselImage[] = carousel.Carousel.map((item: any) => ({
      id: item.id || generateId(),
      src: item.ImageSrc || item.src,
      title: item.title || '',
      caption: item.caption || '',
      alt: item.alt || ''
    }))
    
    // Map old settings to new structure
    const migratedSettings: CarouselSettings = {
      images: migratedImages,
      heightMode: carousel.ViewMode === 2 ? 'fixed' : carousel.ViewMode === 1 ? 'auto' : 'responsive',
      fixedHeight: carousel.FixedHeight || 400,
      imageFit: 'cover',
      showArrows: carousel.showArrows !== false,
      showIndicators: !carousel.hideDelimiters,
      hideIndicators: carousel.hideDelimiters || false,
      showThumbnails: false,
      enableLightbox: true,
      autoPlay: carousel.cycle !== false,
      interval: carousel.interval || 6000,
      pauseOnHover: true,
      transition: mapOldTransition(carousel.Transition),
      transitionDuration: 500
    }
    
    // Update element with migrated settings
    props.element.Carousel = migratedSettings
    return migratedSettings
  }
  
  return props.element.Carousel as CarouselSettings
}

// Helper to map old transition names
const mapOldTransition = (oldTransition?: string): string => {
  if (!oldTransition) return 'fade'
  if (oldTransition.includes('fade')) return 'fade'
  if (oldTransition.includes('slide')) return 'slide'
  if (oldTransition.includes('scale')) return 'scale'
  return 'fade'
}

const carouselSettings = reactive(getSettings())

// Image form
const imageForm = reactive({
  src: '',
  title: '',
  caption: '',
  alt: ''
})

// Check if in edit mode
const isEditMode = computed({
  get: () => props.element.EditMode || false,
  set: (value) => {
    props.element.EditMode = value
  }
})

// Computed carousel height
const carouselHeight = computed(() => {
  switch (carouselSettings.heightMode) {
    case 'auto':
      return undefined
    case 'fixed':
      return carouselSettings.fixedHeight
    case 'responsive':
      return '56.25%' // 16:9 aspect ratio
    default:
      return 400
  }
})

// Lightbox image
const lightboxImage = computed(() => {
  return carouselSettings.images[lightboxIndex.value]
})

// Options
const imageFitOptions = [
  { title: 'Cover (fill area)', value: 'cover' },
  { title: 'Contain (fit inside)', value: 'contain' },
  { title: 'None (original size)', value: 'none' }
]

const transitionOptions = [
  { title: 'Fade', value: 'fade' },
  { title: 'Slide', value: 'slide' },
  { title: 'Scale', value: 'scale' }
]

// Validation rules
const rules = {
  required: (v: string) => !!v || 'Required',
  url: (v: string) => {
    try {
      new URL(v)
      return true
    } catch {
      return 'Please enter a valid URL'
    }
  }
}

// Methods
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const generateId = (): string => {
  return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const openLightbox = (index: number) => {
  if (carouselSettings.enableLightbox) {
    lightboxIndex.value = index
    showLightbox.value = true
  }
}

const editImage = (image: CarouselImage) => {
  editingImage.value = image
  imageForm.src = image.src
  imageForm.title = image.title || ''
  imageForm.caption = image.caption || ''
  imageForm.alt = image.alt || ''
  showImageDialog.value = true
}

const removeImage = (id: string) => {
  const index = carouselSettings.images.findIndex(img => img.id === id)
  if (index > -1) {
    carouselSettings.images.splice(index, 1)
    
    // Adjust current slide if needed
    if (currentSlide.value >= carouselSettings.images.length) {
      currentSlide.value = Math.max(0, carouselSettings.images.length - 1)
    }
  }
}

const closeImageDialog = () => {
  showImageDialog.value = false
  editingImage.value = null
  imageForm.src = ''
  imageForm.title = ''
  imageForm.caption = ''
  imageForm.alt = ''
}

const saveImage = () => {
  if (!imageForm.src || !isValidUrl(imageForm.src)) return
  
  if (editingImage.value) {
    // Update existing image
    const index = carouselSettings.images.findIndex(img => img.id === editingImage.value!.id)
    if (index > -1) {
      carouselSettings.images[index] = {
        ...editingImage.value,
        src: imageForm.src,
        title: imageForm.title,
        caption: imageForm.caption,
        alt: imageForm.alt
      }
    }
  } else {
    // Add new image
    const newImage: CarouselImage = {
      id: generateId(),
      src: imageForm.src,
      title: imageForm.title,
      caption: imageForm.caption,
      alt: imageForm.alt
    }
    carouselSettings.images.push(newImage)
    
    // Navigate to new image
    nextTick(() => {
      currentSlide.value = carouselSettings.images.length - 1
    })
  }
  
  closeImageDialog()
}

// Watch for settings changes
watch(carouselSettings, (newSettings) => {
  props.element.Carousel = { ...newSettings }
}, { deep: true })

// Fix indicator visibility conflict
watch(() => carouselSettings.showIndicators, (show) => {
  if (show) {
    carouselSettings.hideIndicators = false
  }
})
</script>

<style scoped>
.carousel-wrapper {
  position: relative;
}

.dashboard-carousel {
  border-radius: 0;
}

.carousel-slide {
  position: relative;
  height: 100%;
  cursor: pointer;
}

.carousel-image {
  transition: transform 0.3s ease;
}

.carousel-slide:hover .carousel-image {
  transform: scale(1.02);
}

.image-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
  color: white;
  padding: 32px 24px 24px;
}

.caption-content {
  max-width: 800px;
  margin: 0 auto;
}

.zoom-button {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-slide:hover .zoom-button {
  opacity: 1;
}

.thumbnail-nav {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 12px;
}

:deep(.v-theme--dark) .thumbnail-nav {
  background-color: rgba(255, 255, 255, 0.05);
}

.thumbnail-container {
  overflow: hidden;
}

.thumbnail-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
}

.thumbnail-item {
  flex: 0 0 auto;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  transform: scale(1.05);
}

.thumbnail-item.active {
  border-color: rgb(var(--v-theme-primary));
}

.thumbnail-image {
  display: block;
}

.empty-state {
  min-height: 300px;
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

.image-list {
  max-height: 400px;
  overflow-y: auto;
}

.drag-handle {
  cursor: move;
}

.preview-image {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.v-theme--dark) .preview-image {
  border-color: rgba(255, 255, 255, 0.12);
}

/* Lightbox styles */
.lightbox-dialog :deep(.v-overlay__content) {
  background: black !important;
}

.lightbox-carousel {
  background: transparent;
}

.lightbox-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
  color: white;
  padding: 48px 24px 24px;
  text-align: center;
}

/* Responsive */
@media (max-width: 600px) {
  .thumbnail-nav {
    padding: 8px;
  }
  
  .thumbnail-item {
    width: 60px;
  }
  
  .thumbnail-image {
    height: 45px !important;
    width: 60px !important;
  }
}
</style>