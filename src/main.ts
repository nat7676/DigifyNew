/**
 * Main entry point for DigifyNew
 * Modern Vue 3 architecture with Composition API
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Core application
import App from './App.vue'
import router from './router'

// Plugins
import vuetify from './plugins/vuetify'

// Styles
import './assets/styles/main.scss'

// Global error handler
const logError = (error: Error | string, source?: string) => {
  console.error(`[${source || 'Global'}] Error:`, error)
  // TODO: Send to error tracking service
}

// Environment check
const isDevelopment = import.meta.env.DEV
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

console.log('🚀 Digify Starting...')
console.log(`Version: ${appVersion}`)
console.log(`Mode: ${isDevelopment ? 'Development' : 'Production'}`)

// Force HTTPS in production
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !isDevelopment) {
  location.protocol = 'https:'
}

async function initializeApp() {
  const app = createApp(App)

  // Error handling
  app.config.errorHandler = (err, _instance, info) => {
    logError(err as Error, `Vue [${info}]`)
  }

  // Global error handlers
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'Window')
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Promise')
  })

  // Initialize Pinia
  const pinia = createPinia()
  app.use(pinia)

  // Setup router
  app.use(router)

  // Setup Vuetify
  app.use(vuetify)

  // Initialize core stores after app is configured
  const { useAuthStore } = await import('./stores/auth')
  const { useSystemStore } = await import('./stores/system')
  const { useUIStore } = await import('./stores/ui')

  const authStore = useAuthStore()
  const systemStore = useSystemStore()
  const uiStore = useUIStore()

  // Set Vuetify instance in UI store
  uiStore.setVuetifyInstance(vuetify)

  // Initialize socket service
  const { default: socketService } = await import('./services/socket.service')
  socketService.initialize()

  try {
    // Initialize stores
    await Promise.all([
      authStore.initialize(),
      systemStore.initialize(),
      uiStore.initialize()
    ])

    console.log('✅ Stores initialized')

    // Connect socket after stores are ready
    socketService.connect()
    console.log('🔌 Socket service connecting...')
    
    // Once connected, try to load domain settings again
    setTimeout(async () => {
      if (socketService.isConnected.value) {
        try {
          await systemStore.loadDomainSettings()
          console.log('✅ Domain settings loaded')
        } catch (error) {
          console.warn('Failed to load domain settings:', error)
        }
      }
    }, 2000)
  } catch (error) {
    console.error('Failed to initialize stores:', error)
    logError(error as Error, 'Store initialization')
  }

  // Mount application
  try {
    app.mount('#app')
    console.log('✅ Digify initialized successfully')
  } catch (mountError) {
    console.error('Error mounting application:', mountError)
    throw mountError
  }

  // Development helpers - temporarily disabled to debug issue
  // if (isDevelopment) {
  //   try {
  //     (window as any).__APP__ = app;
  //     (window as any).__ROUTER__ = router;
  //     (window as any).__STORES__ = { authStore, systemStore, uiStore };
  //     (window as any).__PINIA__ = pinia;
  //   } catch (devError) {
  //     console.error('Error setting development helpers:', devError)
  //   }
  // }
}

// Initialize application
initializeApp().catch((error) => {
  console.error('Failed to start application:', error)
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1>Failed to start application</h1>
        <p>Please refresh the page or contact support.</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px;">${error}</pre>
      </div>
    </div>
  `
})