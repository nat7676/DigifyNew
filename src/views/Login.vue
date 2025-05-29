<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      align="center"
      justify="center"
      class="fill-height"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
        lg="4"
        xl="3"
      >
        <v-card
          elevation="8"
          rounded="lg"
        >
          <!-- Logo -->
          <v-card-text class="text-center pa-8">
            <v-img
              :src="logoUrl"
              height="80"
              contain
              class="mx-auto mb-6"
            />
            <h1 class="text-h4 mb-2">Welcome to {{ systemName }}</h1>
            <p class="text-body-2 text-medium-emphasis">Sign in to continue</p>
          </v-card-text>

          <v-divider />

          <!-- Login Form -->
          <v-card-text class="pa-8">
            <v-form
              v-model="valid"
              @submit.prevent="handleLogin"
            >
              <!-- Mobile Number -->
              <v-text-field
                v-model="mobile"
                label="Mobile Number"
                prepend-inner-icon="mdi-phone"
                type="tel"
                variant="outlined"
                :rules="mobileRules"
                :error-messages="errors.mobile"
                @input="clearError('mobile')"
              />

              <!-- Password -->
              <v-text-field
                v-model="password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                variant="outlined"
                :rules="passwordRules"
                :error-messages="errors.password"
                @click:append-inner="showPassword = !showPassword"
                @input="clearError('password')"
              />

              <!-- Remember Me -->
              <v-checkbox
                v-model="rememberMe"
                label="Remember me"
                density="compact"
                class="mb-4"
              />

              <!-- Login Button -->
              <v-btn
                type="submit"
                block
                size="large"
                color="primary"
                :disabled="!valid || loading"
                :loading="loading"
              >
                Sign In
              </v-btn>

              <!-- Divider -->
              <div class="d-flex align-center my-6">
                <v-divider />
                <span class="mx-4 text-medium-emphasis">OR</span>
                <v-divider />
              </div>

              <!-- Microsoft Login -->
              <v-btn
                block
                size="large"
                variant="outlined"
                prepend-icon="mdi-microsoft"
                :disabled="loading"
                @click="handleMicrosoftLogin"
              >
                Sign in with Microsoft
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Footer -->
          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn
              variant="text"
              size="small"
              @click="forgotPassword"
            >
              Forgot Password?
            </v-btn>
            <v-spacer />
            <v-btn
              icon
              size="small"
              @click="showDebug = !showDebug"
              :color="showDebug ? 'primary' : undefined"
            >
              <v-icon>mdi-bug</v-icon>
            </v-btn>
          </v-card-actions>
          
          <!-- Debug Panel -->
          <v-expand-transition>
            <v-card-text v-if="showDebug" class="pa-4 bg-grey-lighten-4">
              <div class="text-caption mb-2">Debug Response:</div>
              <pre 
                v-if="debugResponse" 
                class="text-caption overflow-auto" 
                style="max-height: 300px; background: white; padding: 8px; border-radius: 4px;"
              >{{ JSON.stringify(debugResponse, null, 2) }}</pre>
              <div v-else class="text-caption text-medium-emphasis">
                No response data yet
              </div>
            </v-card-text>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const authStore = useAuthStore()
const systemStore = useSystemStore()
const uiStore = useUIStore()

// Form state
const valid = ref(false)
const mobile = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)

// Debug state
const showDebug = ref(false)
const debugResponse = ref<any>(null)

// Error state
const errors = ref<{
  mobile?: string
  password?: string
}>({})

// Computed
const logoUrl = computed(() => systemStore.logoUrl)
const systemName = computed(() => systemStore.systemName)

// Validation rules
const mobileRules = [
  (v: string) => !!v || 'Mobile number is required',
  (v: string) => /^\d{8,15}$/.test(v) || 'Please enter a valid mobile number'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters'
]

// Methods
const clearError = (field: 'mobile' | 'password') => {
  errors.value[field] = undefined
}

const handleLogin = async () => {
  if (!valid.value) return

  loading.value = true
  errors.value = {}

  try {
    await authStore.login(mobile.value, password.value)
    
    // Save mobile if remember me is checked
    if (rememberMe.value) {
      localStorage.setItem('rememberedMobile', mobile.value)
    } else {
      localStorage.removeItem('rememberedMobile')
    }

    uiStore.showSuccess('Welcome back!')
    
    // Clear debug on success
    debugResponse.value = null
    
    // Debug navigation
    console.log('Login successful, navigating to dashboard...')
    console.log('Current route:', router.currentRoute.value.path)
    console.log('Is authenticated:', authStore.isAuthenticated)
    
    // Use Vue Router navigation
    await router.push('/dashboard')
  } catch (error: any) {
    console.error('Login failed:', error)
    
    // Store debug response
    debugResponse.value = {
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      request: {
        mobile: mobile.value,
        domain: window.location.hostname,
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      response: error.response || error,
      stack: error.stack
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      errors.value.password = 'Invalid mobile number or password'
    } else if (error.response?.status === 429) {
      errors.value.mobile = 'Too many attempts. Please try again later.'
    } else {
      uiStore.showError(error.message || 'Login failed. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

const handleMicrosoftLogin = async () => {
  loading.value = true
  try {
    await authStore.loginWithMicrosoft()
  } catch (error) {
    console.error('Microsoft login failed:', error)
    uiStore.showError('Microsoft login failed. Please try again.')
  } finally {
    loading.value = false
  }
}

const forgotPassword = () => {
  // TODO: Implement forgot password flow
  uiStore.showWarning('Password reset not implemented yet')
}

// Lifecycle
onMounted(() => {
  // Load remembered mobile
  const remembered = localStorage.getItem('rememberedMobile')
  if (remembered) {
    mobile.value = remembered
    rememberMe.value = true
  }

  // Check if already authenticated
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}</style>