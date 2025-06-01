/**
 * UI Store
 * Handles UI state, notifications, theme, and user preferences
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

interface SnackbarOptions {
  text: string
  color?: string
  timeout?: number
  show?: boolean
}

interface DialogOptions {
  title: string
  text: string
  confirmText?: string
  cancelText?: string
  persistent?: boolean
}

// Store reference to Vuetify instance
let vuetifyInstance: any = null

export const useUIStore = defineStore('ui', () => {
  // State
  const drawer = ref(true)
  const rail = ref(false)
  const darkMode = ref(false)
  const loading = ref(false)
  const loadingText = ref('')
  const isEditMode = ref(false)
  const snackbar = ref<SnackbarOptions>({
    text: '',
    color: 'info',
    timeout: 5000,
    show: false
  })
  const dialog = ref<DialogOptions | null>(null)
  const dialogResolve = ref<((value: boolean) => void) | null>(null)

  // Computed
  const isDarkMode = computed(() => darkMode.value)
  const isLoading = computed(() => loading.value)

  // Methods
  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }

  const toggleRail = () => {
    rail.value = !rail.value
  }

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }

  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
    localStorage.setItem('RIEditMode', isEditMode.value ? '1' : '0')
    showSnackbar({
      text: isEditMode.value ? 'Edit mode enabled' : 'Edit mode disabled',
      color: isEditMode.value ? 'warning' : 'info',
      timeout: 2000
    })
  }

  const setLoading = (state: boolean, text = '') => {
    loading.value = state
    loadingText.value = text
  }

  const showSnackbar = (options: string | SnackbarOptions) => {
    if (typeof options === 'string') {
      snackbar.value = {
        text: options,
        color: 'info',
        timeout: 5000,
        show: true
      }
    } else {
      snackbar.value = {
        ...options,
        show: true
      }
    }
  }

  const showSuccess = (text: string) => {
    showSnackbar({
      text,
      color: 'success',
      timeout: 3000
    })
  }

  const showError = (text: string) => {
    showSnackbar({
      text,
      color: 'error',
      timeout: 7000
    })
  }

  const showWarning = (text: string) => {
    showSnackbar({
      text,
      color: 'warning',
      timeout: 5000
    })
  }

  const hideSnackbar = () => {
    snackbar.value.show = false
  }

  const showDialog = (options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      dialog.value = {
        confirmText: 'OK',
        cancelText: 'Cancel',
        persistent: false,
        ...options
      }
      dialogResolve.value = resolve
    })
  }

  const confirm = async (title: string, text: string): Promise<boolean> => {
    return showDialog({
      title,
      text,
      confirmText: 'Yes',
      cancelText: 'No'
    })
  }

  const closeDialog = (result: boolean) => {
    if (dialogResolve.value) {
      dialogResolve.value(result)
    }
    dialog.value = null
    dialogResolve.value = null
  }

  const loadPreferences = () => {
    // Load from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      darkMode.value = savedDarkMode === 'true'
    }

    const savedDrawer = localStorage.getItem('drawer')
    if (savedDrawer !== null) {
      drawer.value = savedDrawer === 'true'
    }

    const savedRail = localStorage.getItem('rail')
    if (savedRail !== null) {
      rail.value = savedRail === 'true'
    }

    // Load edit mode preference
    const savedEditMode = localStorage.getItem('RIEditMode')
    if (savedEditMode !== null) {
      isEditMode.value = savedEditMode === '1'
    }
  }

  const savePreferences = () => {
    localStorage.setItem('darkMode', darkMode.value.toString())
    localStorage.setItem('drawer', drawer.value.toString())
    localStorage.setItem('rail', rail.value.toString())
  }

  // Set Vuetify instance
  const setVuetifyInstance = (instance: any) => {
    vuetifyInstance = instance
  }

  // Watch for changes and update theme
  watch(darkMode, (newValue) => {
    if (vuetifyInstance) {
      vuetifyInstance.theme.global.name.value = newValue ? 'dark' : 'light'
    }
    savePreferences()
  })

  // Watch other preferences
  watch([drawer, rail], () => {
    savePreferences()
  })

  const initialize = async () => {
    loadPreferences()
    
    // Apply theme
    if (vuetifyInstance) {
      vuetifyInstance.theme.global.name.value = darkMode.value ? 'dark' : 'light'
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        // Only apply if user hasn't manually set theme
        const manuallySet = localStorage.getItem('darkMode')
        if (manuallySet === null) {
          darkMode.value = e.matches
        }
      })

      // Set initial value if not manually set
      const manuallySet = localStorage.getItem('darkMode')
      if (manuallySet === null) {
        darkMode.value = mediaQuery.matches
      }
    }
  }

  return {
    // State
    drawer: computed(() => drawer.value),
    rail: computed(() => rail.value),
    darkMode: computed(() => darkMode.value),
    loading: computed(() => loading.value),
    loadingText: computed(() => loadingText.value),
    snackbar: computed(() => snackbar.value),
    dialog: computed(() => dialog.value),
    isEditMode: computed(() => isEditMode.value),
    
    // Computed
    isDarkMode,
    isLoading,
    
    // Methods
    toggleDrawer,
    toggleRail,
    toggleDarkMode,
    toggleEditMode,
    setLoading,
    setVuetifyInstance,
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    hideSnackbar,
    showDialog,
    confirm,
    closeDialog,
    initialize
  }
})