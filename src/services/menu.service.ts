/**
 * Menu Service
 * Handles dynamic menu building and management
 */

import type { MenuItem } from '@/types/menu'
import { Setting } from '@/modules/shared/shared'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import templateService from '@/services/template.service'
import router from '@/router'

class MenuService {
  /**
   * Build the default navigation menu
   * This is only used as a fallback when no server menu is available
   */
  buildDefaultNavigationMenu(): MenuItem[] {
    const authStore = useAuthStore()
    
    // Get current context ID for URLs
    const contextId = authStore.currentSystemId || authStore.currentToken?.systemid || 1
    
    // Build default menu structure as fallback
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
   * Get menu from server (from template cache)
   */
  async getMenuFromServer(): Promise<MenuItem[] | null> {
    try {
      const systemStore = useSystemStore()
      
      // First check if we have custom menu items in the system store
      if (systemStore.menuItems && systemStore.menuItems.length > 0) {
        return this.processServerMenu(systemStore.menuItems)
      }
      
      // Check if domain settings have been loaded
      if (!systemStore.domainSettings) {
        console.log('Domain settings not loaded yet')
        return null
      }
      
      // Domain settings from loadDomainSettings are already parsed
      // They contain the parsed SettingsJson content
      const settings = systemStore.domainSettings as any
      
      // Check for menu in different locations based on old system structure
      if (settings.ActiveSettings?.Menu) {
        return this.processServerMenu(settings.ActiveSettings.Menu)
      } else if (settings.SystemSettings?.Menu) {
        return this.processServerMenu(settings.SystemSettings.Menu)
      } else if (settings.DomainSettings?.Menu) {
        return this.processServerMenu(settings.DomainSettings.Menu)
      } else if (settings.DefaultValues?.Menu) {
        return this.processServerMenu(settings.DefaultValues.Menu)
      } else if (settings.Menu) {
        // Sometimes menu is directly on the settings object
        return this.processServerMenu(settings.Menu)
      }
      
      // Legacy support: Check if MenuItems is a string property
      if (typeof settings.MenuItems === 'string') {
        try {
          const menuItems = JSON.parse(settings.MenuItems)
          return this.processServerMenu(menuItems)
        } catch (parseError) {
          console.error('Failed to parse MenuItems string:', parseError)
        }
      } else if (Array.isArray(settings.MenuItems)) {
        return this.processServerMenu(settings.MenuItems)
      }
      
      console.log('No menu found in domain settings:', settings)
      return null
    } catch (error) {
      console.error('Failed to get menu from server:', error)
      return null
    }
  }
  
  /**
   * Process server menu items to ensure proper format
   */
  private processServerMenu(menuItems: any[]): MenuItem[] {
    if (!Array.isArray(menuItems)) {
      return []
    }
    
    return menuItems.map(item => {
      const processed: MenuItem = {
        title: item.title || item.Title,
        url: item.url || item.Url,
        icon: item.icon || item.Icon || item.vicon,
        iconcolor: item.iconcolor || item.IconColor,
        divider: item.divider || item.Divider,
        badge: item.badge || item.Badge,
        badgeColor: item.badgeColor || item.BadgeColor,
        Visible: item.Visible || item.visible
      }
      
      // Process children recursively
      if (item.children || item.Children) {
        processed.children = this.processServerMenu(item.children || item.Children)
      }
      
      // Process click handler if it's a string
      if (item.click && typeof item.click === 'string') {
        // For now, just log it - in production, you'd evaluate or map the function
        console.warn('String click handlers not yet supported:', item.click)
      }
      
      return processed
    })
  }
  
  /**
   * Get the final menu (server menu with fallback to default)
   */
  async getMenu(): Promise<MenuItem[]> {
    // Try to get menu from server first
    const serverMenu = await this.getMenuFromServer()
    if (serverMenu && serverMenu.length > 0) {
      console.log('Using menu from server:', serverMenu)
      return serverMenu
    }
    
    // Fall back to default menu
    console.log('Using default menu - no server menu available')
    return this.buildDefaultNavigationMenu()
  }
  
  /**
   * Save menu to server
   * Updates the domain settings with the new menu configuration
   */
  async saveMenu(menuItems: MenuItem[], level: 'domain' | 'system' = 'domain'): Promise<void> {
    try {
      const systemStore = useSystemStore()
      
      if (!systemStore.domainSettings) {
        throw new Error('Domain settings not loaded')
      }
      
      // Get current settings
      const settings = { ...(systemStore.domainSettings as any) }
      
      // Update menu based on level
      if (level === 'domain') {
        if (!settings.DomainSettings) {
          settings.DomainSettings = {}
        }
        settings.DomainSettings.Menu = menuItems
      } else if (level === 'system') {
        if (!settings.SystemSettings) {
          settings.SystemSettings = {}
        }
        settings.SystemSettings.Menu = menuItems
      }
      
      // Save updated settings
      await templateService.savePortalSettings(
        window.location.hostname,
        settings
      )
      
      // Update local store
      systemStore.menuItems = menuItems
      
      // Reset template cache to ensure fresh data
      await templateService.resetTemplateCache()
      
      console.log('Menu saved successfully')
    } catch (error) {
      console.error('Failed to save menu:', error)
      throw error
    }
  }
}

export default new MenuService()