/**
 * Socket.io Service
 * Handles real-time WebSocket communication with the server
 */

import { io, type Socket } from 'socket.io-client'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { NodeObject } from '@/modules/shared/shared'
import { NodeEvent, SubmitType, eventconfig } from '@/modules/shared/shared'
import { logRequest, logResponse, logError, logConnection } from '@/utils/logger'

// Socket state
const sockets = ref<Socket[]>([])
const isConnected = ref(false)
const reconnectAttempts = ref(0)
const subscriptions = ref<Map<string, Set<(data: any) => void>>>(new Map())

// Connection promise for waiting until connected
let connectionPromise: Promise<void> | null = null
let connectionResolve: (() => void) | null = null

// Request tracking
interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  timeout: number
  startTime?: number
}

const pendingRequests = ref<Map<string, PendingRequest>>(new Map())

// Server URLs (round-robin for load balancing)
const serverUrls = [
   'https://napi.digify.no:3004' // exclusive for debugging
 /*  'https://napi.digify.no',
  'https://napi.digify.no:3000',
  'https://napi.digify.no:3002',
  'https://napi.digify.no:3003', */
]

// Generate unique request ID
function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Get next server URL (round-robin) - currently not used due to multi-socket approach
// function getNextServerUrl(): string {
//   const url = serverUrls[activeSocketIndex.value]
//   activeSocketIndex.value = (activeSocketIndex.value + 1) % serverUrls.length
//   return url
// }

// Initialize socket connections
export function initializeSockets() {
  const authStore = useAuthStore()
  // const systemStore = useSystemStore() // Currently not used
  
  // Create connection promise
  connectionPromise = new Promise((resolve) => {
    connectionResolve = resolve
  })
  
  // Create socket connections to all servers
  serverUrls.forEach((url) => {
    const socket = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket'],
      auth: {
        token: authStore.bearerToken
      }
    })

    // Connection event handlers
    socket.on('connect', () => {
      logConnection('connected', url)
      isConnected.value = true
      reconnectAttempts.value = 0
      
      // Resolve connection promise on first connection
      if (connectionResolve) {
        connectionResolve()
        connectionResolve = null
      }
      
      // Re-subscribe to all active subscriptions
      resubscribeAll(socket)
    })

    socket.on('disconnect', (reason) => {
      logConnection('disconnected', url, { reason })
      checkAllDisconnected()
    })

    socket.on('connect_error', (error) => {
      logConnection('error', url, { error: error.message })
      reconnectAttempts.value++
    })

    // Handle all server responses through NewObject event
    socket.onAny((event: string, data: NodeObject) => {
      if (event === NodeEvent.NewObject || event === 'NewObject') {
        handleResponse(data)
      }
    })

    sockets.value.push(socket)
  })
}

// Check if all sockets are disconnected
function checkAllDisconnected() {
  const anyConnected = sockets.value.some(socket => socket.connected)
  if (!anyConnected) {
    isConnected.value = false
  }
}

// Connect all sockets
export function connect() {
  sockets.value.forEach(socket => {
    if (!socket.connected) {
      socket.connect()
    }
  })
}

// Disconnect all sockets
export function disconnect() {
  sockets.value.forEach(socket => {
    if (socket.connected) {
      socket.disconnect()
    }
  })
}

// Get active socket for requests
function getActiveSocket(): Socket | null {
  // Try to find a connected socket
  const connectedSocket = sockets.value.find(socket => (socket as any).connected === true)
  if (connectedSocket) return connectedSocket

  // If no sockets connected, return first one
  return sockets.value[0] || null
}

// Wait for connection
async function waitForConnection(): Promise<void> {
  if (isConnected.value) return
  if (connectionPromise) {
    await connectionPromise
  }
}

// Send request to server
export async function sendRequest<T = any>(
  event: NodeEvent,
  data: any = {},
  options: { timeout?: number; skipWait?: boolean } = {}
): Promise<T> {
  // Wait for connection unless explicitly skipped
  if (!options.skipWait) {
    await waitForConnection()
  }
  
  const socket = getActiveSocket()
  if (!socket || !socket.connected) {
    throw new Error('Not connected to server')
  }

  const authStore = useAuthStore()

  // Check authentication requirements
  const config = eventconfig[event]
  if (config.LoginRequired && !authStore.isAuthenticated && event !== NodeEvent.Api) {
    throw new Error('Authentication required')
  }

  // Generate request ID
  const guid = generateGuid()
  
  // Create request object with proper structure
  const request: any = {
    Event: event,  // Note: capital E for Event
    SubmitType: SubmitType.Request,
    Guid: guid,    // Note: capital G for Guid
    [event]: data  // Event-specific data
  }
  
  // Only add login if we have a token
  if (authStore.currentToken) {
    request.login = authStore.currentToken
  }

  // Create promise for response
  const promise = new Promise<T>((resolve, reject) => {
    const timeout = options.timeout || 30000
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      pendingRequests.value.delete(guid)
      reject(new Error(`Request timeout for ${event}`))
    }, timeout) as unknown as number

    // Store pending request
    pendingRequests.value.set(guid, {
      resolve,
      reject,
      timeout: timeoutId
    })
  })

  // Log the request
  const startTime = Date.now()
  logRequest(event, guid, request)
  
  // Store start time for response timing
  pendingRequests.value.get(guid)!.startTime = startTime

  // Send request using NewObject event
  socket.emit(NodeEvent.NewObject, request)

  return promise
}

// Handle server response
function handleResponse(response: NodeObject) {
  const { Guid: guid, SubmitType: submitType, Event: event } = response

  if (!guid) return

  const pending = pendingRequests.value.get(guid)
  const timeMs = pending?.startTime ? Date.now() - pending.startTime : 0
  
  // Handle different response types
  switch (submitType) {
    case SubmitType.Response:
    case SubmitType.Ack:
      if (pending) {
        // Success response
        clearTimeout(pending.timeout)
        pendingRequests.value.delete(guid)
        
        // Log successful response
        logResponse(event, guid, response, timeMs)
        
        // Extract event-specific data - the response is in the event field
        pending.resolve(response)
      } else {
        // Server-initiated event (not a response to our request)
        logResponse(event, guid, response, 0)
        emitToSubscribers(event, response)
      }
      break

    case SubmitType.Error:
      if (pending) {
        // Error response
        clearTimeout(pending.timeout)
        pendingRequests.value.delete(guid)
        
        const errorMessage = (response as any).error || (response as any).Error || 'Request failed'
        const error = new Error(errorMessage)
        ;(error as any).response = response
        
        // Log error
        logError(event, guid, error, timeMs)
        
        pending.reject(error)
      }
      break

    case SubmitType.Stream:
      // Streaming response - don't clear pending request yet
      // Emit to subscribers
      const streamEvent = `stream:${guid}`
      emitToSubscribers(streamEvent, response)
      break
  }
}

// Subscribe to events
export function subscribe(
  event: string,
  callback: (data: any) => void
): () => void {
  if (!subscriptions.value.has(event)) {
    subscriptions.value.set(event, new Set())
  }

  subscriptions.value.get(event)!.add(callback)

  // Return unsubscribe function
  return () => {
    const callbacks = subscriptions.value.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        subscriptions.value.delete(event)
      }
    }
  }
}

// Emit to subscribers
function emitToSubscribers(event: string, data: any) {
  const callbacks = subscriptions.value.get(event)
  if (callbacks) {
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in subscriber for ${event}:`, error)
      }
    })
  }
}

// Re-subscribe to all active subscriptions
function resubscribeAll(socket: Socket) {
  // Re-subscribe to events that require it
  subscriptions.value.forEach((callbacks, event) => {
    if (callbacks.size > 0) {
      // Check if this is a subscription event
      const nodeEvent = event as NodeEvent
      const config = eventconfig[nodeEvent]
      
      if (config?.Subscription) {
        // Send subscription request
        const request: any = {
          Event: nodeEvent,
          SubmitType: SubmitType.Request,
          Guid: generateGuid(),
          [nodeEvent]: { subscribe: true }
        }
        
        socket.emit('request', request)
      }
    }
  })
}

// Socket service API
export const socketService = {
  // Connection state
  isConnected: computed(() => isConnected.value),
  reconnectAttempts: computed(() => reconnectAttempts.value),
  
  // Methods
  initialize: initializeSockets,
  connect,
  disconnect,
  sendRequest,
  subscribe,
  
  // Specific event methods
  async sendChatMessage(roomId: string, message: string) {
    return sendRequest(NodeEvent.ChatMsg, {
      roomId,
      message,
      timestamp: new Date()
    })
  },
  
  async subscribeToChat(roomId: string, callback: (msg: any) => void) {
    // Subscribe to chat room
    await sendRequest(NodeEvent.ChatMsg, {
      roomId,
      subscribe: true
    })
    
    // Listen for messages
    return subscribe(`chat:${roomId}`, callback)
  }
}

export default socketService