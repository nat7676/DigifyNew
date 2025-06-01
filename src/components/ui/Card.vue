<template>
  <v-card
    :elevation="elevation"
    :class="cardClasses"
  >
    <v-card-title v-if="showTitle && title">
      {{ title }}
    </v-card-title>
    
    <v-divider v-if="showTitle && title" />
    
    <v-card-text :class="contentClasses">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  showTitle?: boolean
  elevation?: number
  noPadding?: boolean
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  elevation: 1,
  noPadding: false,
  dense: false
})

const cardClasses = computed(() => ({
  'dashboard-card': true,
  'dense-card': props.dense
}))

const contentClasses = computed(() => ({
  'pa-0': props.noPadding,
  'pa-2': props.dense && !props.noPadding,
  'pa-4': !props.dense && !props.noPadding
}))
</script>

<style scoped>
.dashboard-card {
  /* Card should size to its content, not fill parent height */
}

.dense-card {
  /* Add any dense-specific styles */
}
</style>