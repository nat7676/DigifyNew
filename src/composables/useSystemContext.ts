/**
 * Composable to handle system context switching based on route contextId
 */
import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

export function useSystemContext() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  const checkAndSwitchSystem = async () => {
    const requestedContextId = route.query.contextId as string
    if (requestedContextId) {
      const requestedSystemId = parseInt(requestedContextId)
      if (requestedSystemId && requestedSystemId !== authStore.currentSystemId) {
        try {
          await authStore.switchSystem(requestedSystemId)
          
          // Emit an event to notify components that system has changed
          window.dispatchEvent(new CustomEvent('system-switched', { 
            detail: { 
              fromSystem: authStore.currentSystemId, 
              toSystem: requestedSystemId 
            } 
          }))
        } catch (error) {
          uiStore.showError(`Failed to switch to system ${requestedSystemId}. You may not have access.`)
          
          // Redirect back to the current system
          router.push({
            path: route.path,
            query: { ...route.query, contextId: authStore.currentSystemId?.toString() }
          })
        }
      }
    }
  }

  // Check on mount
  onMounted(() => {
    checkAndSwitchSystem()
  })

  // Watch for route changes
  watch(() => route.query.contextId, () => {
    checkAndSwitchSystem()
  })

  return {
    checkAndSwitchSystem
  }
}