<template>
  <v-card class="ma-4">
    <v-card-title>Portal Switching Test</v-card-title>
    <v-card-text>
      <v-table density="compact">
        <tbody>
          <tr>
            <td><strong>Window Hostname:</strong></td>
            <td>{{ hostname }}</td>
          </tr>
          <tr>
            <td><strong>getDomain():</strong></td>
            <td>{{ currentDomain }}</td>
          </tr>
          <tr>
            <td><strong>useportal (localStorage):</strong></td>
            <td>{{ usePortal || 'Not set' }}</td>
          </tr>
          <tr>
            <td><strong>Portal Unique Key:</strong></td>
            <td>{{ portalUniqueKey || 'Not loaded' }}</td>
          </tr>
          <tr>
            <td><strong>Portal ID:</strong></td>
            <td>{{ portalID || 'Not loaded' }}</td>
          </tr>
          <tr>
            <td><strong>System Unique Key:</strong></td>
            <td>{{ systemUniqueKey || 'Not loaded' }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-divider class="my-4" />

      <div class="mb-4">
        <v-text-field
          v-model="testPortal"
          label="Test Portal Domain"
          placeholder="e.g., test.digify.no"
          density="compact"
        />
        <v-btn
          color="primary"
          size="small"
          @click="setTestPortal"
          :disabled="!testPortal"
        >
          Set Test Portal
        </v-btn>
        <v-btn
          color="secondary"
          size="small"
          class="ml-2"
          @click="clearTestPortal"
        >
          Clear Portal Override
        </v-btn>
      </div>

      <v-alert
        v-if="message"
        :type="messageType"
        closable
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>

      <v-divider class="my-4" />

      <v-btn
        color="info"
        size="small"
        @click="refreshPortalInfo"
      >
        Refresh Portal Info
      </v-btn>
      <v-btn
        color="warning"
        size="small"
        class="ml-2"
        @click="reinitializePortal"
      >
        Reinitialize Portal
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getDomain, setPortalOverride, clearPortalOverride } from '@/utils/domain'
import templateService from '@/services/template.service'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()

// State
const hostname = ref(window.location.hostname)
const currentDomain = ref(getDomain())
const usePortal = ref(localStorage.getItem('useportal'))
const portalUniqueKey = ref<string | null>(null)
const portalID = ref<number | null>(null)
const systemUniqueKey = ref<string | null>(null)
const testPortal = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('info')

// Methods
const refreshPortalInfo = () => {
  hostname.value = window.location.hostname
  currentDomain.value = getDomain()
  usePortal.value = localStorage.getItem('useportal')
  portalUniqueKey.value = templateService.getPortalUniqueKey()
  portalID.value = templateService.getPortalID()
  systemUniqueKey.value = templateService.getSystemUniqueKey()
  
  message.value = 'Portal info refreshed'
  messageType.value = 'info'
}

const setTestPortal = () => {
  if (testPortal.value) {
    setPortalOverride(testPortal.value)
    usePortal.value = testPortal.value
    currentDomain.value = getDomain()
    
    message.value = `Portal override set to: ${testPortal.value}. Page will reload in 2 seconds...`
    messageType.value = 'success'
    
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }
}

const clearTestPortal = () => {
  clearPortalOverride()
  usePortal.value = null
  currentDomain.value = getDomain()
  
  message.value = 'Portal override cleared. Page will reload in 2 seconds...'
  messageType.value = 'warning'
  
  setTimeout(() => {
    window.location.reload()
  }, 2000)
}

const reinitializePortal = async () => {
  try {
    message.value = 'Reinitializing portal...'
    messageType.value = 'info'
    
    await templateService.reinitializePortal()
    await systemStore.loadDomainSettings()
    
    refreshPortalInfo()
    
    message.value = 'Portal reinitialized successfully!'
    messageType.value = 'success'
  } catch (error) {
    console.error('Failed to reinitialize portal:', error)
    message.value = `Failed to reinitialize portal: ${error}`
    messageType.value = 'error'
  }
}

// Watch for domain changes
watch(() => getDomain(), (newDomain) => {
  currentDomain.value = newDomain
  refreshPortalInfo()
})

// Initialize
onMounted(() => {
  refreshPortalInfo()
})
</script>