<template>
  <Card 
    :title="element.title || 'Info Box'"
    :show-title="element.showHeader !== false"
  >
    <div
      class="info-content"
      :style="contentStyle"
      v-html="displayContent"
    />
    
    <!-- Edit Mode Content -->
    <template v-if="isEditMode">
      <v-divider class="my-4" />
      <div class="edit-controls">
        <TextArea 
          v-model="infoSettings.Content" 
          label="Content"
          :rows="5"
        />
        
        <CheckBox 
          v-model="infoSettings.Center" 
          label="Center text"
          class="mt-2"
        />
        
        <CheckBox
          v-model="infoSettings.Memorize"
          label="Memorize (random words hidden)"
          class="mt-2"
        />
        
        <TextField
          v-if="infoSettings.Memorize"
          v-model.number="infoSettings.MemorizeFactor"
          type="number"
          label="Memorize factor (0-100)"
          :min="0"
          :max="100"
          class="mt-2"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import Card from '@/components/ui/Card.vue'
import TextArea from '@/components/ui/TextArea.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import TextField from '@/components/ui/TextField.vue'
import { createPartiallyRedactedText } from '@/utils/tools'

interface InfoboxSettings {
  Content: string
  Center: boolean
  Memorize: boolean
  MemorizeFactor: number
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  Infobox?: InfoboxSettings
  Content?: string
  Center?: boolean
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()

// Initialize settings
const getSettings = (): InfoboxSettings => {
  if (!props.element.Infobox) {
    // Initialize with default values or migrate from old properties
    const defaultSettings: InfoboxSettings = {
      Content: props.element.Content || 'Write something here',
      Center: props.element.Center || false,
      Memorize: false,
      MemorizeFactor: 80
    }
    
    // Store the settings back in the element
    props.element.Infobox = defaultSettings
  }
  return props.element.Infobox
}

const infoSettings = reactive(getSettings())

// Check if in edit mode
const isEditMode = computed(() => props.element.EditMode || false)

// Computed content style
const contentStyle = computed(() => ({
  'white-space': 'pre-wrap',
  'text-align': infoSettings.Center ? 'center' : 'left'
}))

// Computed display content
const displayContent = computed((): string => {
  if (infoSettings.Memorize && infoSettings.MemorizeFactor > 0) {
    return createPartiallyRedactedText(
      infoSettings.Content,
      infoSettings.MemorizeFactor
    )
  }
  return infoSettings.Content
})

// Watch for external content changes
watch(() => props.element.Content, (newContent) => {
  if (newContent && newContent !== infoSettings.Content) {
    infoSettings.Content = newContent
  }
})

// Save settings back to element when they change
watch(infoSettings, (newSettings) => {
  props.element.Infobox = { ...newSettings }
}, { deep: true })
</script>

<style scoped>
.info-content {
  /* Ensure content has appropriate min-height but doesn't take too much space */
  min-height: 2rem;
  /* Add some breathing room */
  line-height: 1.5;
}

.edit-controls {
  padding: 0;
}
</style>