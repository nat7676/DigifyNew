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
router.beforeEach(async (to, _from, next) => {
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
    next('/insight/dashboard')
    return
  }

  // TODO: Check permissions based on user roles
  // if (to.meta.roles && !authStore.hasRoles(to.meta.roles)) {
  //   next('/unauthorized')
  //   return
  // }

  next()
})

export default router