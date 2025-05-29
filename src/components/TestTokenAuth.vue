<template>
  <v-card elevation="2" class="pa-4">
    <v-card-title>Token Authentication Test</v-card-title>
    
    <v-card-text>
      <div class="mb-4">
        <v-chip :color="authStore.isAuthenticated ? 'success' : 'error'" label>
          {{ authStore.isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}
        </v-chip>
        <v-chip v-if="authStore.currentToken" label class="ml-2">
          System: {{ authStore.currentToken.systemid }}
        </v-chip>
        <v-chip v-if="authStore.currentToken" label class="ml-2">
          User: {{ authStore.currentToken.userid }}
        </v-chip>
      </div>
      
      <div v-if="authStore.currentToken" class="mb-4">
        <div class="text-caption text-medium-emphasis mb-1">Token Info:</div>
        <pre class="text-caption" style="background: #f5f5f5; padding: 8px; border-radius: 4px;">{{ JSON.stringify({
          systemid: authStore.currentToken.systemid,
          userid: authStore.currentToken.userid,
          AccessLevelID: authStore.currentToken.AccessLevelID,
          expire: authStore.currentToken.expire,
          expiredate: authStore.currentToken.expiredate
        }, null, 2) }}</pre>
      </div>

      <v-btn 
        @click="testAuthenticatedRequest" 
        :loading="loading"
        :disabled="!authStore.isAuthenticated"
        color="primary"
      >
        Test Authenticated Request
      </v-btn>

      <v-btn 
        @click="clearResponse" 
        variant="text"
        class="ml-2"
        v-if="response"
      >
        Clear
      </v-btn>
    </v-card-text>

    <v-expand-transition>
      <v-card-text v-if="response">
        <v-divider class="mb-4" />
        <div class="text-caption mb-2">Response:</div>
        <pre class="text-caption overflow-auto" style="max-height: 400px; background: #f5f5f5; padding: 12px; border-radius: 4px;">{{ JSON.stringify(response, null, 2) }}</pre>
      </v-card-text>
    </v-expand-transition>

    <v-expand-transition>
      <v-card-text v-if="error">
        <v-divider class="mb-4" />
        <v-alert type="error" variant="tonal">
          <div class="text-caption mb-2">Error:</div>
          <pre class="text-caption">{{ JSON.stringify(error, null, 2) }}</pre>
        </v-alert>
      </v-card-text>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import socketService from '@/services/socket.service'
import { NodeEvent } from '@/modules/shared/shared'

const authStore = useAuthStore()

const loading = ref(false)
const response = ref<any>(null)
const error = ref<any>(null)

const testAuthenticatedRequest = async () => {
  loading.value = true
  response.value = null
  error.value = null

  try {
    // Test with a simple authenticated request
    // Let's try a simple endpoint that requires authentication
    const testResponse = await socketService.sendRequest(NodeEvent.Api, {
      path: '/Cloud/customer/system/list',
      data: {},
      settings: {}
    })

    response.value = {
      success: true,
      timestamp: new Date().toISOString(),
      request: {
        event: 'Api',
        path: '/Cloud/customer/system/list',
        token: authStore.currentToken?.AccessToken ? 'Token present (hidden)' : 'No token'
      },
      response: testResponse
    }

    console.log('Test response:', testResponse)
  } catch (err: any) {
    console.error('Test failed:', err)
    error.value = {
      message: err.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      request: {
        event: 'Api',
        path: '/Cloud/customer/system/list',
        token: authStore.currentToken?.AccessToken ? 'Token present (hidden)' : 'No token'
      },
      response: err.response || err,
      stack: err.stack
    }
  } finally {
    loading.value = false
  }
}

const clearResponse = () => {
  response.value = null
  error.value = null
}
</script>