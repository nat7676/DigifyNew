import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDebugStore = defineStore('debug', () => {
  // State
  const dashboardData = ref<any>(null)
  const dashboardType = ref<string>('')
  const dashboardObjectId = ref<string | undefined>(undefined)
  
  // Actions
  const setDashboardData = (data: any, type: string, objectId?: string) => {
    dashboardData.value = data
    dashboardType.value = type
    dashboardObjectId.value = objectId
  }
  
  const clearDashboardData = () => {
    dashboardData.value = null
    dashboardType.value = ''
    dashboardObjectId.value = undefined
  }
  
  return {
    // State
    dashboardData,
    dashboardType,
    dashboardObjectId,
    
    // Actions
    setDashboardData,
    clearDashboardData
  }
})