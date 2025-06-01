<template>
  <div class="dashboard-not-found">
    <!-- Animated Background -->
    <div class="animated-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Main Content -->
    <v-container class="content-wrapper">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" md="8" lg="6">
          <div class="text-center">
            <!-- Animated Icon -->
            <div class="icon-wrapper mb-8">
              <v-icon
                size="120"
                color="primary"
                class="main-icon"
              >
                mdi-view-dashboard-outline
              </v-icon>
              <div class="icon-badge">
                <v-icon size="40" color="white">mdi-alert-circle</v-icon>
              </div>
            </div>

            <!-- Title with Gravitas -->
            <h1 class="text-h2 font-weight-bold mb-4 title-text">
              Dashboard Not Found
            </h1>
            
            <!-- Poetic Subtitle -->
            <p class="text-h6 text-medium-emphasis mb-8 subtitle-text">
              The dashboard you seek exists beyond the veil of current configurations
            </p>

            <!-- Technical Details Card -->
            <v-card
              class="mx-auto mb-8 details-card"
              max-width="500"
              variant="tonal"
            >
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" size="20">mdi-information-outline</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">
                    Technical Details
                  </span>
                </div>
                
                <div class="detail-item" v-if="element.layoutType">
                  <span class="detail-label">Requested Layout:</span>
                  <code class="detail-value">{{ element.layoutType }}</code>
                </div>
                
                <div class="detail-item" v-if="element.contextId">
                  <span class="detail-label">Context ID:</span>
                  <code class="detail-value">{{ element.contextId }}</code>
                </div>
                
                <div class="detail-item" v-if="element.error">
                  <span class="detail-label">Error:</span>
                  <code class="detail-value text-error">{{ element.error }}</code>
                </div>
                
                <div class="detail-item" v-if="element.message">
                  <span class="detail-label">Message:</span>
                  <span class="detail-value">{{ element.message }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <v-chip
                    size="small"
                    color="warning"
                    variant="flat"
                    class="ml-2"
                  >
                    No Template Configured
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <v-btn
                size="large"
                color="primary"
                variant="flat"
                prepend-icon="mdi-home"
                class="mr-4 action-btn"
                @click="navigateHome"
              >
                Return to Dashboard
              </v-btn>
              
              <v-btn
                v-if="canConfigureDashboard"
                size="large"
                variant="tonal"
                prepend-icon="mdi-cog"
                class="action-btn"
                @click="openConfiguration"
              >
                Configure Dashboard
              </v-btn>
            </div>

            <!-- Helpful Message -->
            <v-alert
              v-if="isDevelopment"
              type="info"
              variant="tonal"
              class="mt-8 mx-auto"
              max-width="500"
            >
              <v-alert-title class="text-subtitle-2">
                Developer Information
              </v-alert-title>
              <div class="text-body-2">
                This dashboard requires a template configuration. Templates can be configured at:
                <ul class="mt-2">
                  <li>Portal level (global default)</li>
                  <li>System level (customer-specific)</li>
                  <li>Object level (instance-specific)</li>
                </ul>
              </div>
            </v-alert>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Decorative Elements -->
    <div class="corner-decoration top-left">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <path
          d="M0,0 Q60,20 80,80 T120,120"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.1"
        />
      </svg>
    </div>
    
    <div class="corner-decoration bottom-right">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <path
          d="M120,120 Q60,100 40,40 T0,0"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.1"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface DashboardElement {
  element: string
  layoutType?: string
  contextId?: string
  systemKey?: string | null
  portalKey?: string | null
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()

// Computed
const canConfigureDashboard = computed(() => {
  // Check if user has admin rights
  return authStore.hasRole(1) || authStore.hasRole(2) // Admin or Designer roles
})

const isDevelopment = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

// Methods
const navigateHome = () => {
  router.push('/dashboard')
}

const openConfiguration = () => {
  // Navigate to dashboard configuration
  router.push({
    path: '/settings/dashboards',
    query: {
      layout: props.element.layoutType,
      configure: 'true'
    }
  })
}
</script>

<style scoped>
.dashboard-not-found {
  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animated Background */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  opacity: 0.5;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(25, 118, 210, 0.3) 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(156, 39, 176, 0.3) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation-delay: 7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(0, 150, 136, 0.3) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* Content */
.content-wrapper {
  position: relative;
  z-index: 1;
}

/* Icon Animation */
.icon-wrapper {
  position: relative;
  display: inline-block;
  animation: pulse 3s ease-in-out infinite;
}

.main-icon {
  filter: drop-shadow(0 4px 20px rgba(25, 118, 210, 0.3));
}

.icon-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff5252 0%, #ff1744 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 23, 68, 0.4);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Typography */
.title-text {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.subtitle-text {
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Details Card */
.details-card {
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.9) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.3s ease;
}

.details-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface), 0.7);
}

.detail-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  padding: 2px 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}

.action-btn {
  min-width: 200px;
  height: 48px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Corner Decorations */
.corner-decoration {
  position: absolute;
  color: rgb(var(--v-theme-primary));
  pointer-events: none;
}

.top-left {
  top: 0;
  left: 0;
}

.bottom-right {
  bottom: 0;
  right: 0;
  transform: rotate(180deg);
}

/* Responsive */
@media (max-width: 600px) {
  .title-text {
    font-size: 2rem;
  }
  
  .subtitle-text {
    font-size: 1rem;
  }
  
  .icon-wrapper {
    transform: scale(0.8);
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
  }
}

/* Dark mode adjustments */
:root .v-theme--dark {
  .details-card {
    background: rgba(var(--v-theme-surface), 0.6) !important;
    border-color: rgba(var(--v-theme-primary), 0.3);
  }
  
  .gradient-orb {
    opacity: 0.3;
  }
}
</style>