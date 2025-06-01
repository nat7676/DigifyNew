<template>
  <v-card
    class="wergeland-orders-module"
    :height="minimized ? 'auto' : undefined"
  >
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Wergeland Orders</span>
      <v-btn
        icon
        size="small"
        variant="text"
        @click="refreshData"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-divider />
    
    <v-card-text>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          color="primary"
        />
        <p class="mt-2 text-body-2">Loading orders...</p>
      </div>
      
      <!-- Error state -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="mb-0"
      >
        {{ error }}
      </v-alert>
      
      <!-- Orders list -->
      <v-list
        v-else-if="orders.length > 0"
        lines="two"
        :dense="minimized"
      >
        <v-list-item
          v-for="order in displayOrders"
          :key="order.id"
        >
          <template #prepend>
            <v-icon :color="getStatusColor(order.status)">
              {{ getStatusIcon(order.status) }}
            </v-icon>
          </template>
          
          <v-list-item-title>
            Order #{{ order.orderNumber }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            {{ order.customerName }} - {{ formatDate(order.date) }}
          </v-list-item-subtitle>
          
          <template #append>
            <v-chip
              :color="getStatusColor(order.status)"
              size="small"
              label
            >
              {{ order.amount }} kr
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
      
      <!-- Empty state -->
      <div v-else class="text-center py-8 text-grey">
        <v-icon size="48" class="mb-2">mdi-package-variant</v-icon>
        <p class="text-body-2">No orders found</p>
      </div>
    </v-card-text>
    
    <!-- View all link when minimized -->
    <v-card-actions v-if="minimized && orders.length > 3">
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        color="primary"
      >
        View all ({{ orders.length }})
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'

interface Props {
  element: {
    uniqueid: string
    element: string
    [key: string]: any
  }
  settings: Record<string, any>
  minimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minimized: false
})

const uiStore = useUIStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const orders = ref<any[]>([])

// Computed
const displayOrders = computed(() => {
  if (props.minimized) {
    return orders.value.slice(0, 3)
  }
  return orders.value
})

// Methods
const loadOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    // TODO: Replace with actual API call
    // For now, use mock data
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    orders.value = [
      {
        id: 1,
        orderNumber: '2024-001',
        customerName: 'Acme Corp',
        date: new Date('2024-01-15'),
        amount: 15000,
        status: 'completed'
      },
      {
        id: 2,
        orderNumber: '2024-002',
        customerName: 'Tech Solutions',
        date: new Date('2024-01-16'),
        amount: 25000,
        status: 'processing'
      },
      {
        id: 3,
        orderNumber: '2024-003',
        customerName: 'Global Industries',
        date: new Date('2024-01-17'),
        amount: 32000,
        status: 'pending'
      },
      {
        id: 4,
        orderNumber: '2024-004',
        customerName: 'Nordic Systems',
        date: new Date('2024-01-18'),
        amount: 18500,
        status: 'completed'
      }
    ]
    
    // Use settings if available
    console.log('Module settings:', props.settings)
    
  } catch (err: any) {
    console.error('Failed to load orders:', err)
    error.value = 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadOrders()
  uiStore.showSnackbar('Orders refreshed')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'processing': return 'mdi-progress-clock'
    case 'pending': return 'mdi-clock-outline'
    case 'cancelled': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Lifecycle
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.wergeland-orders-module {
  transition: all 0.3s ease;
}
</style>