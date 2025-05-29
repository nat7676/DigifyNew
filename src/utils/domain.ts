/**
 * Domain utilities
 * Handles domain extraction with special cases for localhost/debug
 * 
 * Default behavior:
 * - localhost -> my.digify.no
 * - Can be overridden using localStorage 'useportal' key
 * 
 * TODO: Implement debug UI to easily change domain for testing
 */

/**
 * Get the current domain with special handling for localhost
 */
export function getDomain(): string {
  let domain = window.location.hostname

  // Special handling for localhost - check for portal override
  if (domain === 'localhost' || domain === 'localhost.digify.no') {
    const useportal = localStorage.getItem('useportal')
    if (useportal) {
      domain = useportal
    } else {
      // Default domain for localhost
      domain = 'my.digify.no'
    }
  }

  return domain
}

/**
 * Set portal override for localhost development
 */
export function setPortalOverride(portal: string): void {
  localStorage.setItem('useportal', portal)
}

/**
 * Clear portal override
 */
export function clearPortalOverride(): void {
  localStorage.removeItem('useportal')
}

/**
 * Get portal override if set
 */
export function getPortalOverride(): string | null {
  return localStorage.getItem('useportal')
}