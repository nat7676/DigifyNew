<template>
  <v-card
   
  >
    
    <v-card-text>
    <pre>{{ data.slice(0, 10) }}</pre>
    </v-card-text>
    
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { executeSQLQueryWithCallback } from '@/services/sql.service'

interface Props {
  element: {
    uniqueid: string
    element: string
    [key: string]: any
  }
  settings: Record<string, any>
  minimized?: boolean
}

const data = ref<any[]>([]);

const props = withDefaults(defineProps<Props>(), {
  minimized: false
})

// Methods
const loadData = async () => {
  data.value =  await executeSQLQueryWithCallback(
    "/components/WebIcons",
    {},
    { array: true }
  );
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>

</style>