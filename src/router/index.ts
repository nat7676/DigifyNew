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

  console.log(`🔄 Navigation: ${from.fullPath} -> ${to.fullPath}`)

  // Check authentication first
  if (requiresAuth && !authStore.isAuthenticated) {
    authStore.setRedirectUrl(to.fullPath)
    next('/login')
    return
  }

  // Redirect authenticated users away from login
  if (to.path === '/login' && authStore.isAuthenticated) {
    const contextId = authStore.currentToken?.systemid || 1
    next(`/insight/dashboard?contextId=${contextId}`)
    return
  }

  // For authenticated routes, ensure contextId is present in the URL
  if (requiresAuth && authStore.isAuthenticated && to.path !== '/login') {
    const contextId = to.query.contextId as string
    
    // If no contextId in URL, add it
    if (!contextId) {
      // Try to get contextId from: URL -> current route -> auth store -> default
      const currentContextId = from.query.contextId || 
                              authStore.currentSystemId || 
                              authStore.currentToken?.systemid || 
                              1
      
      console.log('Adding missing contextId:', currentContextId)
      next({
        ...to,
        query: { ...to.query, contextId: currentContextId }
      })
      return
    }
  }

  // Allow navigation
  next()
})

export default router