/**
 * Vue Router Configuration
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Route definitions
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/insight/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: {
      requiresAuth: false,
      layout: 'blank'
    }
  },
  {
    path: '/dashboard',
    redirect: '/insight/dashboard'  // Redirect old path to new path
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/insight/dashboard',
    name: 'insight-dashboard',
    component: () => import('@/views/InsightDashboard.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  // Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    // Store intended destination
    authStore.setRedirectUrl(to.fullPath)
    next('/login')
    return
  }

  // Check if user is trying to access login while authenticated
  if (to.path === '/login' && authStore.isAuthenticated) {
    // Get contextId from current token or default to current system
    const contextId = authStore.currentToken?.systemid || 1
    next(`/insight/dashboard?contextId=${contextId}`)
    return
  }

  // For authenticated routes, ensure contextId is present
  if (requiresAuth && authStore.isAuthenticated) {
    const contextId = to.query.contextId as string
    const currentSystemId = authStore.currentSystemId
    
    // If no contextId in URL, add it
    if (!contextId) {
      next({
        ...to,
        query: { ...to.query, contextId: currentSystemId || 1 }
      })
      return
    }
    
    // Parse the requested system ID
    const requestedSystemId = parseInt(contextId)
    
    // Check if this is the same navigation we just processed
    // This happens when we change the query params
    if (to.path === from.path && 
        to.query.contextId === from.query.contextId &&
        JSON.stringify(to.params) === JSON.stringify(from.params)) {
      // Same route, just let it through
      next()
      return
    }
    
    // If contextId doesn't match current system, switch systems
    if (requestedSystemId !== currentSystemId) {
      console.log('System mismatch detected. Current:', currentSystemId, 'Requested:', requestedSystemId)
      
      try {
        // Switch to the requested system
        await authStore.switchSystem(requestedSystemId)
        console.log('Successfully switched to system:', requestedSystemId)
        
        // Continue with navigation - the system has been switched
        next()
        return
      } catch (error) {
        console.error('Failed to switch systems:', error)
        
        // If switch fails completely, just continue anyway
        // The app will handle the mismatch appropriately
        next()
        return
      }
    }
  }

  next()
})

export default router