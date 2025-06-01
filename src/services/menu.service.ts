/**
 * Menu Service
 * Handles dynamic menu building and management
 */

import type { MenuItem } from '@/types/menu'
import { Setting } from '@/modules/shared/shared'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import router from '@/router'

class MenuService {
  /**
   * Build the main navigation menu
   * Based on the old system's buildMainNavigationMenu function
   */
  buildMainNavigationMenu(): MenuItem[] {
    const authStore = useAuthStore()
    
    // Get current context ID for URLs
    const contextId = authStore.currentSystemId || authStore.currentToken?.systemid || 1
    
    // Build dynamic menu structure
    const menuItems: MenuItem[] = [
      {
        title: 'Dashboard',
        url: `/insight/dashboard?contextId=${contextId}`,
        icon: 'mdi-view-dashboard',
        iconcolor: 'primary'
      },
      {
        title: 'Personal Dashboard',
        url: `/insight/personaldashboard?contextId=${contextId}`,
        icon: 'mdi-account-box',
        iconcolor: 'blue'
      },
      {
        divider: true
      },
      {
        title: 'Companies',
        icon: 'mdi-domain',
        iconcolor: 'teal',
        children: [
          {
            title: 'Company Overview',
            url: `/insight/companies?contextId=${contextId}`,
            icon: 'mdi-view-list'
          },
          {
            title: 'Add Company',
            url: `/insight/companies/add?contextId=${contextId}`,
            icon: 'mdi-plus'
          },
          {
            title: 'Search Companies',
            url: `/insight/companies/search?contextId=${contextId}`,
            icon: 'mdi-magnify'
          }
        ]
      },
      {
        title: 'Contracts',
        icon: 'mdi-file-document',
        iconcolor: 'orange',
        children: [
          {
            title: 'Contract List',
            url: `/insight/contracts?contextId=${contextId}`,
            icon: 'mdi-format-list-bulleted'
          },
          {
            title: 'New Contract',
            url: `/insight/contracts/new?contextId=${contextId}`,
            icon: 'mdi-file-document-plus'
          },
          {
            title: 'Templates',
            url: `/insight/contracts/templates?contextId=${contextId}`,
            icon: 'mdi-file-multiple'
          }
        ]
      },
      {
        title: 'Documents',
        url: `/insight/documents?contextId=${contextId}`,
        icon: 'mdi-folder-open',
        iconcolor: 'amber',
        badge: '12',
        badgeColor: 'red'
      },
      {
        divider: true
      },
      {
        title: 'Tools',
        icon: 'mdi-tools',
        iconcolor: 'grey',
        children: [
          {
            title: 'Similar Search',
            url: `/insight/similarsearch?contextId=${contextId}`,
            icon: 'mdi-text-search',
            Visible: Setting.SimilarSearch
          },
          {
            title: 'Import Data',
            url: `/insight/import?contextId=${contextId}`,
            icon: 'mdi-database-import'
          },
          {
            title: 'Export Data',
            url: `/insight/export?contextId=${contextId}`,
            icon: 'mdi-database-export'
          },
          {
            divider: true
          },
          {
            title: 'Analytics',
            url: `/insight/analytics?contextId=${contextId}`,
            icon: 'mdi-chart-line'
          },
          {
            title: 'Reports',
            url: `/insight/reports?contextId=${contextId}`,
            icon: 'mdi-file-chart'
          }
        ]
      },
      {
        title: 'SMS',
        icon: 'mdi-message-text',
        iconcolor: 'green',
        Visible: Setting.SMS,
        children: [
          {
            title: 'Send SMS',
            url: `/insight/sms/send?contextId=${contextId}`,
            icon: 'mdi-send'
          },
          {
            title: 'SMS History',
            url: `/insight/sms/history?contextId=${contextId}`,
            icon: 'mdi-history'
          },
          {
            title: 'Templates',
            url: `/insight/sms/templates?contextId=${contextId}`,
            icon: 'mdi-file-document-outline'
          }
        ]
      },
      {
        title: 'API',
        icon: 'mdi-api',
        iconcolor: 'purple',
        Visible: Setting.API,
        children: [
          {
            title: 'API Keys',
            url: `/insight/api/keys?contextId=${contextId}`,
            icon: 'mdi-key'
          },
          {
            title: 'Documentation',
            url: `/insight/api/docs?contextId=${contextId}`,
            icon: 'mdi-book-open-page-variant'
          },
          {
            title: 'Usage',
            url: `/insight/api/usage?contextId=${contextId}`,
            icon: 'mdi-chart-bar'
          }
        ]
      }
    ]
    
    // Add debug menu items (these are the non-dashboard routes)
    if (import.meta.env.DEV) {
      menuItems.push(
        {
          divider: true
        },
        {
          title: 'Debug Pages',
          icon: 'mdi-bug',
          iconcolor: 'red',
          children: [
            {
              title: 'Profile',
              url: `/profile?contextId=${contextId}`,
              icon: 'mdi-account'
            },
            {
              title: 'Settings',
              url: `/settings?contextId=${contextId}`,
              icon: 'mdi-cog'
            }
          ]
        }
      )
    }
    
    // Filter menu items based on visibility settings
    return this.filterMenuItemsByPermissions(menuItems)
  }
  
  /**
   * Filter menu items based on user permissions
   */
  filterMenuItemsByPermissions(items: MenuItem[]): MenuItem[] {
    // const authStore = useAuthStore() // Will be used when permission checking is implemented
    
    return items.filter(item => {
      // If no visibility setting, always show
      if (!item.Visible) return true
      
      // Check if user has the required permission
      // This would check against user roles/settings
      // For now, we'll show everything
      return true
    }).map(item => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: this.filterMenuItemsByPermissions(item.children)
        }
      }
      return item
    })
  }
  
  /**
   * Handle menu item click
   */
  async handleMenuClick(item: MenuItem) {
    if (item.click) {
      // Execute custom click handler
      await item.click()
    } else if (item.url) {
      // Navigate to URL
      await router.push(item.url)
    }
  }
  
  /**
   * Get menu from server (for domain-specific menus)
   */
  async getMenuFromServer(): Promise<MenuItem[] | null> {
    try {
      const systemStore = useSystemStore()
      
      // First check if we have menu items in the system store
      if (systemStore.menuItems && systemStore.menuItems.length > 0) {
        return systemStore.menuItems
      }
      
      // Then check domain settings
      const domainSettings = systemStore.domainSettings
      if (domainSettings?.MenuItems) {
        // Parse menu items from domain settings
        return JSON.parse(domainSettings.MenuItems)
      }
      
      return null
    } catch (error) {
      console.error('Failed to get menu from server:', error)
      return null
    }
  }
  
  /**
   * Get the final menu (server menu with fallback to default)
   */
  async getMenu(): Promise<MenuItem[]> {
    // Try to get menu from server first
    const serverMenu = await this.getMenuFromServer()
    if (serverMenu) {
      return serverMenu
    }
    
    // Fall back to built-in menu
    return this.buildMainNavigationMenu()
  }
}

export default new MenuService()