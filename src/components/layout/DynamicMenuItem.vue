<template>
  <div>
    <!-- Divider -->
    <v-divider
      v-if="item.divider"
      :class="level > 0 ? 'mx-4' : ''"
    />
    
    <!-- Menu Group with Children -->
    <v-list-group
      v-else-if="item.children && item.children.length > 0"
      :value="item.title || 'group'"
    >
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          :prepend-icon="item.icon"
          :title="item.title"
        >
          <template v-if="item.icon" #prepend>
            <v-icon
              :color="item.iconcolor"
              :icon="item.icon"
            />
          </template>
          
          <template v-if="item.badge" #append>
            <v-badge
              :color="item.badgeColor || 'primary'"
              :content="item.badge"
              inline
            />
          </template>
        </v-list-item>
      </template>
      
      <!-- Recursive children -->
      <dynamic-menu-item
        v-for="(child, childIndex) in item.children"
        :key="`child-${childIndex}`"
        :item="child"
        :level="level + 1"
      />
    </v-list-group>
    
    <!-- Single Menu Item -->
    <v-list-item
      v-else
      :to="item.url"
      :exact="item.exact"
      @click="handleClick"
    >
      <template v-if="item.icon" #prepend>
        <v-icon
          :color="item.iconcolor"
          :icon="item.icon"
        />
      </template>
      
      <v-list-item-title v-if="item.title">{{ item.title }}</v-list-item-title>
      
      <template v-if="item.badge" #append>
        <v-badge
          :color="item.badgeColor || 'primary'"
          :content="item.badge"
          inline
        />
      </template>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/types/menu'
import menuService from '@/services/menu.service'

interface Props {
  item: MenuItem
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

// Handle custom click actions
const handleClick = async () => {
  if (props.item.click) {
    await menuService.handleMenuClick(props.item)
  }
}
</script>

<style scoped>
/* Indent nested items */
.v-list-group__items .v-list-item {
  padding-inline-start: calc(16px + var(--indent-padding, 0px)) !important;
}
</style>