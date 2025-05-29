/**
 * Logger utility for debugging socket communication
 */

interface LogStyle {
  background: string
  color: string
  padding: string
  borderRadius: string
  fontWeight: string
}

const styles = {
  request: {
    background: '#2196F3',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  response: {
    background: '#4CAF50',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  error: {
    background: '#f44336',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  event: {
    background: '#FF9800',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    fontWeight: 'normal'
  }
}

function getStyleString(style: LogStyle): string {
  return Object.entries(style)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ')
}

export function logRequest(event: string, guid: string, data: any) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  
  console.groupCollapsed(
    `%c⬆️ REQUEST %c${event} %c${guid.substring(0, 8)}... %c${timestamp}`,
    getStyleString(styles.request),
    getStyleString(styles.event),
    'color: #666; font-size: 11px',
    'color: #999; font-size: 11px'
  )
  
  console.log('%cEvent:', 'font-weight: bold; color: #2196F3', event)
  console.log('%cGUID:', 'font-weight: bold; color: #2196F3', guid)
  console.log('%cData:', 'font-weight: bold; color: #2196F3', data)
  
  // Pretty print the data
  if (data && typeof data === 'object') {
    console.log('%cFormatted:', 'font-weight: bold; color: #666')
    console.log(JSON.stringify(data, null, 2))
  }
  
  console.groupEnd()
}

export function logResponse(event: string, guid: string, data: any, timeMs: number) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  
  console.groupCollapsed(
    `%c⬇️ RESPONSE %c${event} %c${guid.substring(0, 8)}... %c${timeMs}ms %c${timestamp}`,
    getStyleString(styles.response),
    getStyleString(styles.event),
    'color: #666; font-size: 11px',
    'color: #4CAF50; font-weight: bold; font-size: 11px',
    'color: #999; font-size: 11px'
  )
  
  console.log('%cEvent:', 'font-weight: bold; color: #4CAF50', event)
  console.log('%cGUID:', 'font-weight: bold; color: #4CAF50', guid)
  console.log('%cTime:', 'font-weight: bold; color: #4CAF50', `${timeMs}ms`)
  console.log('%cData:', 'font-weight: bold; color: #4CAF50', data)
  
  // Pretty print the data
  if (data && typeof data === 'object') {
    console.log('%cFormatted:', 'font-weight: bold; color: #666')
    console.log(JSON.stringify(data, null, 2))
  }
  
  console.groupEnd()
}

export function logError(event: string, guid: string, error: any, timeMs?: number) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  
  console.groupCollapsed(
    `%c❌ ERROR %c${event} %c${guid.substring(0, 8)}... ${timeMs ? `%c${timeMs}ms` : ''} %c${timestamp}`,
    getStyleString(styles.error),
    getStyleString(styles.event),
    'color: #666; font-size: 11px',
    timeMs ? 'color: #f44336; font-weight: bold; font-size: 11px' : '',
    'color: #999; font-size: 11px'
  )
  
  console.log('%cEvent:', 'font-weight: bold; color: #f44336', event)
  console.log('%cGUID:', 'font-weight: bold; color: #f44336', guid)
  if (timeMs) {
    console.log('%cTime:', 'font-weight: bold; color: #f44336', `${timeMs}ms`)
  }
  console.log('%cError:', 'font-weight: bold; color: #f44336', error)
  
  if (error.stack) {
    console.log('%cStack:', 'font-weight: bold; color: #666')
    console.error(error.stack)
  }
  
  console.groupEnd()
}

export function logConnection(status: 'connected' | 'disconnected' | 'error', url: string, details?: any) {
  const icon = status === 'connected' ? '🟢' : status === 'disconnected' ? '🔴' : '⚠️'
  const color = status === 'connected' ? '#4CAF50' : status === 'disconnected' ? '#f44336' : '#FF9800'
  
  console.log(
    `%c${icon} SOCKET ${status.toUpperCase()} %c${url}`,
    `background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold`,
    'color: #666'
  )
  
  if (details) {
    console.log('Details:', details)
  }
}