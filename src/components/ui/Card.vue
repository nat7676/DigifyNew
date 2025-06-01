<template>
  <v-card
    :elevation="computedElevation"
    :class="cardClasses"
    :style="cardStyles"
    :loading="loading"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Card Header -->
    <v-card-title v-if="showTitle && title" :class="titleClasses">
      <div class="d-flex align-center" style="width: 100%;">
        <!-- Pre-title content -->
        <slot name="pre" />
        
        <!-- Pre-title icon -->
        <v-icon 
          v-if="icon"
          :icon="icon"
          size="small"
          class="mr-2"
        />
        
        <!-- Title -->
        <span :class="{ 'flex-grow-1': !centerTitle, 'mx-auto': centerTitle }">
          {{ title }}
        </span>
        
        <!-- Post-title content -->
        <slot name="post" />
        
        <!-- Header Actions -->
        <v-spacer v-if="!centerTitle" />
        
        <!-- Right slot content -->
        <slot name="append" />
      </div>
    </v-card-title>
    
    <v-divider v-if="showTitle && title" />
    
    <!-- Card Subtitle -->
    <v-card-subtitle v-if="subtitle">
      {{ subtitle }}
    </v-card-subtitle>
    
    <!-- Card Content -->
    <v-card-text :class="contentClasses" :style="contentStyles">
      <slot />
    </v-card-text>
    
    <!-- Actions slot -->
    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  showTitle?: boolean
  elevation?: number
  loading?: boolean
  icon?: string
  centerTitle?: boolean
  noPadding?: boolean
  dense?: boolean
  padding?: number | string
  color?: string
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  height?: string | number
  width?: string | number
  maxHeight?: string | number
  maxWidth?: string | number
  minHeight?: string | number
  minWidth?: string | number
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  elevation: 1,
  loading: false,
  centerTitle: false,
  noPadding: false,
  dense: false,
  hover: true
})

// State
const isHovered = ref(false)

// Computed properties
const computedElevation = computed(() => {
  if (!props.hover) return props.elevation
  return isHovered.value ? 4 : props.elevation
})

const cardClasses = computed(() => ({
  'standalone-card': true,
  'dense-card': props.dense
}))

const titleClasses = computed(() => ({
  'text-center': props.centerTitle
}))

const contentClasses = computed(() => {
  const classes: string[] = []
  
  // Handle padding
  if (props.noPadding) {
    classes.push('pa-0')
  } else if (props.padding !== undefined) {
    const padding = parseInt(String(props.padding))
    if (!isNaN(padding)) {
      classes.push(`pa-${padding}`)
    }
  } else {
    classes.push(props.dense ? 'pa-2' : 'pa-4')
  }
  
  return classes
})

const cardStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.maxHeight) {
    styles.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  }
  
  if (props.maxWidth) {
    styles.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  }
  
  if (props.minHeight) {
    styles.minHeight = typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
  }
  
  if (props.minWidth) {
    styles.minWidth = typeof props.minWidth === 'number' ? `${props.minWidth}px` : props.minWidth
  }
  
  return styles
})

const contentStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.height) {
    styles.overflow = 'auto'
  }
  
  return styles
})
</script>

<style scoped>
.standalone-card {
  transition: elevation 0.3s ease;
}

.dense-card .v-card__text {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
</style>