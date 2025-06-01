<template>
  <Card
    v-if="hasAccess"
    :title="title || element.title"
    :show-title="showHeader"
    :elevation="computedElevation"
    :loading="loading"
    :icon="preTitleIcon"
    :center-title="centerTitle"
    :padding="typeof element.padding === 'object' ? undefined : element.padding"
    :no-padding="element.nopadding"
    :height="typeof element.fixedheight === 'object' ? undefined : (element.fixedheight || element.height)"
    :width="typeof element.width === 'object' ? undefined : element.width"
    :max-height="typeof element.maxheight === 'object' ? undefined : element.maxheight"
    :max-width="typeof element.maxwidth === 'object' ? undefined : element.maxwidth"
    :min-height="typeof element.minheight === 'object' ? undefined : element.minheight"
    :min-width="typeof element.minwidth === 'object' ? undefined : element.minwidth"
    :hover="!element.disableHoverElevation"
    :class="dashboardCardClasses"
    :style="dashboardCardStyles"
  >
    <!-- Pre-title content -->
    <template #pre>
      <slot name="pre" />
    </template>
    
    <!-- Post-title content -->
    <template #post>
      <slot name="post" />
    </template>
    
    <!-- Header append content -->
    <template #append>
      <!-- Access indicator -->
      <v-chip
        v-if="showAccessIndicator"
        size="x-small"
        variant="tonal"
        class="mr-2"
      >
        <v-icon size="x-small" start>{{ accessIcon }}</v-icon>
        {{ accessLabel }}
      </v-chip>
      
      <!-- Save notification -->
      <v-progress-circular
        v-if="saveNotification"
        size="20"
        width="2"
        indeterminate
        class="mr-2"
      />
      
      <!-- Right slot content -->
      <slot name="right" />
      
      <!-- Card menu -->
      <v-menu v-if="showCardMenu && !isMinimized">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
            v-bind="props"
            @click.stop
          />
        </template>
        <v-list density="compact">
          <v-list-item @click="toggleMinimize">
            <v-list-item-title>
              {{ isMinimized ? 'Expand' : 'Minimize' }}
            </v-list-item-title>
            <template v-slot:prepend>
              <v-icon>{{ isMinimized ? 'mdi-arrow-expand' : 'mdi-arrow-collapse' }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item 
            v-if="element.EditMode !== false"
            @click="$emit('edit')"
          >
            <v-list-item-title>Edit</v-list-item-title>
            <template v-slot:prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <!-- Minimize/Maximize button -->
      <v-btn
        v-if="!showCardMenu"
        :icon="isMinimized ? 'mdi-chevron-down' : 'mdi-chevron-up'"
        size="small"
        variant="text"
        @click.stop="toggleMinimize"
      />
    </template>
    
    <!-- Main content with expand transition -->
    <v-expand-transition>
      <div v-show="!isMinimized">
        <!-- Main content slot -->
        <slot />
      </div>
    </v-expand-transition>
    
    <!-- Actions slot -->
    <template #actions v-if="!isMinimized && $slots.actions">
      <slot name="actions" />
    </template>
    
    <!-- Footer slot -->
    <template v-if="!isMinimized && $slots.footer">
      <div class="card-footer">
        <slot name="footer" />
      </div>
    </template>
    
    <!-- Edit Mode Overlay -->
    <v-overlay
      v-if="isInEditMode && element.EditMode !== false"
      model-value
      contained
      persistent
      class="edit-overlay"
    >
      <div class="edit-content">
        <slot name="editcontent">
          <p class="text-h6 mb-2">Edit Mode</p>
          <p class="text-body-2">Configure this module's settings</p>
        </slot>
      </div>
    </v-overlay>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import Card from './Card.vue'

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  notitle?: boolean
  subtitle?: boolean
  centertitle?: boolean
  EditMode?: boolean
  bgcolor?: string
  transparentBackground?: boolean
  disableElevation?: boolean
  disableHoverElevation?: boolean
  fixedheight?: number | string
  height?: number | string
  maxwidth?: number | string
  minwidth?: number | string
  padding?: number | string
  margin?: number | string
  nopadding?: boolean
  scrollable?: boolean
  scrolldown?: boolean
  CSS?: string
  BannerImage?: string
  preTitleIcon?: string
  headerBackgroundColorId?: number
  MinimumAccessLevel?: number
  AccessRoles?: { [key: string]: boolean }
  HiddenModule?: boolean
  savenotification?: boolean
  showCardMenu?: boolean
  [key: string]: any
}

interface Props {
  element: DashboardElement
  elevation?: number
  loading?: boolean
  minimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  elevation: 2,
  loading: false,
  minimized: false
})

const emit = defineEmits<{
  'update:minimized': [value: boolean]
  'edit': []
  'clickoutside': []
}>()

const authStore = useAuthStore()
const uiStore = useUIStore()

// State
const isMinimized = ref(props.minimized)
const contentEl = ref<HTMLElement>()

// Access control
const hasAccess = computed(() => {
  const element = props.element
  
  // Check if module is hidden
  if (element.HiddenModule) return false
  
  // Check minimum access level (only if > 0)
  if (element.MinimumAccessLevel && element.MinimumAccessLevel > 0) {
    const userLevel = authStore.currentToken?.AccessLevelID || 0
    if (userLevel < element.MinimumAccessLevel) return false
  }
  
  // Check access roles (only if roles are defined and required)
  if (element.AccessRoles && Object.keys(element.AccessRoles).length > 0) {
    // Check if any role is required (value is true)
    const hasRequiredRoles = Object.entries(element.AccessRoles).some(
      ([_, required]) => required
    )
    
    // Only check roles if there are actually required roles
    if (hasRequiredRoles && authStore.currentToken?.roles) {
      const hasRequiredRole = Object.entries(element.AccessRoles).some(
        ([roleId, required]) => required && authStore.currentToken?.roles?.[Number(roleId)]
      )
      if (!hasRequiredRole) return false
    }
  }
  
  // Default to showing the card
  return true
})

// Computed properties
const title = computed(() => props.element.title)
const showHeader = computed(() => !props.element.notitle && props.element.showHeader !== false)
const centerTitle = computed(() => props.element.centertitle || false)
const preTitleIcon = computed(() => props.element.preTitleIcon)
const saveNotification = computed(() => props.element.savenotification || false)
const showCardMenu = computed(() => props.element.showCardMenu !== false)
const isInEditMode = computed(() => uiStore.isEditMode)

const computedElevation = computed(() => {
  if (props.element.disableElevation) return 0
  return props.elevation
})

const showAccessIndicator = computed(() => {
  return props.element.MinimumAccessLevel || props.element.AccessRoles
})

const accessIcon = computed(() => {
  if (props.element.MinimumAccessLevel) return 'mdi-shield'
  return 'mdi-account-key'
})

const accessLabel = computed(() => {
  if (props.element.MinimumAccessLevel) {
    return `Level ${props.element.MinimumAccessLevel}+`
  }
  return 'Role Required'
})

// Dynamic classes and styles
const dashboardCardClasses = computed(() => ({
  'dashboard-card': true,
  'subtitle-mode': props.element.subtitle,
  'transparent-bg': props.element.transparentBackground,
  'minimized': isMinimized.value,
  'edit-mode': isInEditMode.value,
  [`header-bg-${props.element.headerBackgroundColorId}`]: props.element.headerBackgroundColorId !== undefined
}))

const dashboardCardStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.element.bgcolor) {
    styles.backgroundColor = props.element.bgcolor
  }
  
  // Handle margins
  if (props.element.margin !== undefined) {
    const margin = parseInt(String(props.element.margin))
    if (!isNaN(margin)) {
      styles.margin = `${margin * 4}px`
    }
  }
  
  // Apply custom CSS if provided
  if (props.element.CSS) {
    try {
      const cssObj = JSON.parse(props.element.CSS)
      Object.assign(styles, cssObj)
    } catch {
      // If not valid JSON, assume it's a CSS string
      // This would need to be parsed differently
    }
  }
  
  // Banner image for title
  if (props.element.BannerImage) {
    styles['--banner-image'] = `url(${props.element.BannerImage})`
  }
  
  return styles
})

// Methods

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
  emit('update:minimized', isMinimized.value)
}

// Title mousedown will be handled via CSS cursor style

// Watch for external minimized prop changes
watch(() => props.minimized, (newVal) => {
  isMinimized.value = newVal
})

// Scroll down functionality
onMounted(() => {
  if (props.element.scrolldown && contentEl.value) {
    nextTick(() => {
      if (contentEl.value) {
        contentEl.value.scrollTop = contentEl.value.scrollHeight
      }
    })
  }
})

// Click outside detection
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const card = (event.target as HTMLElement).closest('.dashboard-card')
    if (!card || card !== contentEl.value?.closest('.dashboard-card')) {
      emit('clickoutside')
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.dashboard-card {
  transition: all 0.3s ease;
}

.dashboard-card :deep(.v-card-title) {
  cursor: move;
}

/* Header background colors */
.dashboard-card.header-bg-0 :deep(.v-card-title) { background-color: #1976D2; color: white; }
.dashboard-card.header-bg-1 :deep(.v-card-title) { background-color: #388E3C; color: white; }
.dashboard-card.header-bg-2 :deep(.v-card-title) { background-color: #D32F2F; color: white; }
.dashboard-card.header-bg-3 :deep(.v-card-title) { background-color: #7B1FA2; color: white; }
.dashboard-card.header-bg-4 :deep(.v-card-title) { background-color: #F57C00; color: white; }
.dashboard-card.header-bg-5 :deep(.v-card-title) { background-color: #0288D1; color: white; }
.dashboard-card.header-bg-6 :deep(.v-card-title) { background-color: #689F38; color: white; }
.dashboard-card.header-bg-7 :deep(.v-card-title) { background-color: #E64A19; color: white; }
.dashboard-card.header-bg-8 :deep(.v-card-title) { background-color: #5E35B1; color: white; }
.dashboard-card.header-bg-9 :deep(.v-card-title) { background-color: #FFA000; color: white; }

/* Dark theme adjustments */
:deep(.v-theme--dark) {
  .dashboard-card.header-bg-0 .v-card-title { background-color: #0D47A1; }
  .dashboard-card.header-bg-1 .v-card-title { background-color: #1B5E20; }
  .dashboard-card.header-bg-2 .v-card-title { background-color: #B71C1C; }
  .dashboard-card.header-bg-3 .v-card-title { background-color: #4A148C; }
  .dashboard-card.header-bg-4 .v-card-title { background-color: #E65100; }
  .dashboard-card.header-bg-5 .v-card-title { background-color: #01579B; }
  .dashboard-card.header-bg-6 .v-card-title { background-color: #33691E; }
  .dashboard-card.header-bg-7 .v-card-title { background-color: #BF360C; }
  .dashboard-card.header-bg-8 .v-card-title { background-color: #311B92; }
  .dashboard-card.header-bg-9 .v-card-title { background-color: #FF6F00; }
}

/* Banner image support */
.dashboard-card[style*="--banner-image"] :deep(.v-card-title) {
  background-image: var(--banner-image);
  background-size: cover;
  background-position: center;
}

.transparent-bg {
  background-color: transparent !important;
}

.card-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 16px;
}

:deep(.v-theme--dark) .card-footer {
  border-top-color: rgba(255, 255, 255, 0.12);
}

.edit-overlay {
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.edit-content {
  text-align: center;
  color: white;
  padding: 24px;
}
</style>