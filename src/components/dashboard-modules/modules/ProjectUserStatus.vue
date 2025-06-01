<template>
  <DashboardCard 
    :element="element"
    :loading="loading"
  >
    <!-- Header Actions -->
    <template #right v-if="!isEditMode">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
            v-bind="props"
          />
        </template>
        <v-list density="compact">
          <v-list-item @click="showAllUsers = !showAllUsers">
            <v-list-item-title>
              {{ showAllUsers ? 'Hide' : 'Show' }} All Users
            </v-list-item-title>
            <template v-slot:prepend>
              <v-icon>{{ showAllUsers ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="refreshData">
            <v-list-item-title>Refresh</v-list-item-title>
            <template v-slot:prepend>
              <v-icon>mdi-refresh</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    
    <!-- Loading State -->
    <div v-if="loading" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-3 text-body-2">Loading project status...</p>
    </div>
    
    <!-- Content -->
    <div v-else>
      <!-- My Status Section -->
      <div v-if="myUserStatus" class="my-status-section pa-4 mb-4">
        <p class="text-subtitle-2 mb-3">My Status</p>
        <v-select
          v-model="myUserStatus.UserStatusID"
          :items="statusOptions"
          item-value="UserStatusID"
          item-title="Status"
          variant="outlined"
          density="compact"
          @update:model-value="updateMyStatus"
        >
          <template v-slot:prepend-inner>
            <v-icon 
              v-if="selectedStatusIcon"
              :color="selectedStatusColor"
              size="small"
            >
              {{ selectedStatusIcon }}
            </v-icon>
          </template>
          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.raw.icon"
              :prepend-color="item.raw.color"
            />
          </template>
        </v-select>
        
        <v-text-field
          v-model.number="myUserStatus.ExtraGuests"
          label="Extra Guests"
          type="number"
          :min="0"
          :max="10"
          variant="outlined"
          density="compact"
          class="mt-3"
          @update:model-value="updateMyStatus"
        />
      </div>
      
      <!-- Status Summary -->
      <div class="status-summary pa-4">
        <p class="text-subtitle-2 mb-3">Status Overview</p>
        <v-row>
          <v-col 
            v-for="status in statusSummary" 
            :key="status.UserStatusID"
            cols="4"
            sm="3"
            md="2"
          >
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div class="text-center" v-bind="props">
                  <v-badge
                    :content="status.UserCount"
                    :color="status.UserCount > 0 ? 'primary' : 'grey'"
                    inline
                  >
                    <v-icon
                      :color="status.color"
                      size="32"
                    >
                      {{ status.icon }}
                    </v-icon>
                  </v-badge>
                </div>
              </template>
              <span>{{ status.Status }} ({{ status.UserCount }})</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </div>
      
      <!-- User List -->
      <v-divider class="my-4" />
      
      <div class="user-list">
        <p class="text-subtitle-2 mb-3 px-4">
          {{ showAllUsers ? 'All Users' : 'Confirmed Users' }}
        </p>
        
        <v-list density="compact">
          <v-list-item
            v-for="user in displayedUsers"
            :key="user.UserID"
            @click="openUserDialog(user)"
          >
            <template v-slot:prepend>
              <v-avatar size="40">
                <v-img 
                  v-if="getUserAvatar(user.UserID)"
                  :src="getUserAvatar(user.UserID)"
                />
                <v-icon v-else>mdi-account-circle</v-icon>
              </v-avatar>
            </template>
            
            <v-list-item-title>
              {{ getUserName(user.UserID) }}
              <v-chip
                v-if="user.ExtraGuests > 0"
                size="x-small"
                class="ml-2"
              >
                +{{ user.ExtraGuests }}
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ getUserPhone(user.UserID) }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-icon
                :color="getStatusColor(user.UserStatusID)"
                size="small"
              >
                {{ getStatusIcon(user.UserStatusID) }}
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
        
        <!-- Show More Button -->
        <div v-if="hasMoreUsers" class="text-center pa-2">
          <v-btn
            variant="text"
            size="small"
            @click="showAllUsers = true"
          >
            Show All ({{ totalUsers }} users)
          </v-btn>
        </div>
      </div>
      
      <!-- Invite Friend Section -->
      <div v-if="settings.ShowInvite" class="invite-section pa-4 mt-4">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-account-plus"
          block
          @click="showInviteDialog = true"
        >
          Invite Friend
        </v-btn>
      </div>
    </div>
    
    <!-- Edit Mode -->
    <template #editcontent v-if="isEditMode">
      <div class="edit-controls pa-4">
        <p class="text-subtitle-2 mb-3">Module Settings</p>
        
        <CheckBox
          v-model="settings.ShowInvite"
          label="Show invite button"
          class="mb-3"
        />
        
        <TextField
          v-model.number="settings.RowCount"
          label="Number of users to display"
          type="number"
          :min="1"
          :max="50"
          class="mb-3"
        />
        
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-message-text</v-icon>
              Message Templates
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <TextArea
                v-model="settings.InviteText"
                label="Invite Message"
                :rows="3"
                placeholder="Hi {{FriendName}}, {{Name}} would like to invite you..."
                class="mb-3"
              />
              
              <TextArea
                v-model="settings.ConfirmText"
                label="Confirm Message"
                :rows="3"
                placeholder="Hi {{FriendName}}, you're invited by {{Name}}..."
                class="mb-3"
              />
              
              <TextArea
                v-model="settings.ConfirmedText"
                label="Confirmed Message"
                :rows="2"
                placeholder="{{FriendName}} has now registered."
              />
              
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                Available variables: {{FriendName}}, {{Name}}, {{InviteUrl}}
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
    
    <!-- User Status Dialog -->
    <v-dialog v-model="userDialog" max-width="500">
      <v-card v-if="selectedUser">
        <v-card-title>
          User Status
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="userDialog = false"
          />
        </v-card-title>
        <v-divider />
        
        <v-card-text class="pa-4">
          <!-- User Info -->
          <div class="d-flex align-center mb-4">
            <v-avatar size="64" class="mr-4">
              <v-img 
                v-if="getUserAvatar(selectedUser.UserID)"
                :src="getUserAvatar(selectedUser.UserID)"
              />
              <v-icon v-else size="48">mdi-account-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6">{{ getUserName(selectedUser.UserID) }}</div>
              <div class="text-body-2 text-grey">{{ getUserPhone(selectedUser.UserID) }}</div>
              <div v-if="getUserEmail(selectedUser.UserID)" class="text-body-2 text-grey">
                {{ getUserEmail(selectedUser.UserID) }}
              </div>
            </div>
          </div>
          
          <!-- Status Selection -->
          <v-select
            v-model="selectedUser.UserStatusID"
            :items="statusOptions"
            item-value="UserStatusID"
            item-title="Status"
            label="Status"
            variant="outlined"
            density="compact"
            class="mb-3"
          >
            <template v-slot:prepend-inner>
              <v-icon 
                v-if="getStatusIcon(selectedUser.UserStatusID)"
                :color="getStatusColor(selectedUser.UserStatusID)"
                size="small"
              >
                {{ getStatusIcon(selectedUser.UserStatusID) }}
              </v-icon>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.raw.icon"
                :prepend-color="item.raw.color"
              />
            </template>
          </v-select>
          
          <!-- Extra Guests -->
          <v-text-field
            v-model.number="selectedUser.ExtraGuests"
            label="Extra Guests"
            type="number"
            :min="0"
            :max="10"
            variant="outlined"
            density="compact"
          />
          
          <!-- Metadata -->
          <div class="text-caption text-grey mt-4">
            <div v-if="selectedUser.CreatedWhen">
              Added: {{ formatDate(selectedUser.CreatedWhen) }}
            </div>
            <div v-if="selectedUser.ChangedStatusWhen">
              Last updated: {{ formatDate(selectedUser.ChangedStatusWhen) }}
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-btn
            v-if="isAdmin"
            color="error"
            variant="text"
            @click="removeUser"
          >
            Remove
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="userDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="text" 
            :loading="saving"
            @click="saveUserStatus"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Invite Friend Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="500">
      <v-card>
        <v-card-title>
          Invite Friend
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showInviteDialog = false"
          />
        </v-card-title>
        <v-divider />
        
        <v-card-text class="pa-4">
          <v-text-field
            v-model="inviteForm.name"
            label="Friend's Name"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          
          <v-text-field
            v-model="inviteForm.phone"
            label="Phone Number"
            variant="outlined"
            density="compact"
            placeholder="+47 XXX XX XXX"
            :rules="[rules.phone]"
          />
          
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            An invitation SMS will be sent to your friend
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showInviteDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="text"
            :loading="inviting"
            :disabled="!inviteForm.name || !inviteForm.phone"
            @click="inviteFriend"
          >
            Send Invite
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </DashboardCard>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import DashboardCard from '@/components/ui/DashboardCard.vue'
import TextField from '@/components/ui/TextField.vue'
import TextArea from '@/components/ui/TextArea.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import { executeSQLQueryWithCallback } from '@/services/sql.service'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Interfaces
interface ProjectUserRef {
  SystemID: number
  ProjectID: number
  UserID: number
  UserStatusID: number
  ExtraGuests: number
  ExtraGuests2?: string
  CreatedWhen: Date
  CreatedBy: number
  ChangedStatusWhen: Date
  ChangedStatusBy: number
  Name: string
  isFriend: boolean
  UserStatus: string
  UserStatusIcon: string
  UserStatusColor: string
}

interface ProjectUserStatusType {
  SystemID: number
  UserStatusID: number
  Status: string
  icon: string
  color: string
  UserCount: number
}

interface UserInfo {
  UserID: number
  Name: string
  Email?: string
  Phone?: string
  Avatar?: string
}

interface ProjectUserStatusSettings {
  InviteText: string
  ConfirmText: string
  ConfirmedText: string
  ShowInvite: boolean
  RowCount: number
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  ProjectUserStatus?: ProjectUserStatusSettings
  projectid?: number
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()
const authStore = useAuthStore()
const uiStore = useUIStore()

// State
const loading = ref(true)
const saving = ref(false)
const inviting = ref(false)
const userDialog = ref(false)
const showInviteDialog = ref(false)
const showAllUsers = ref(false)
const selectedUser = ref<ProjectUserRef | null>(null)
const myUserStatus = ref<ProjectUserRef | null>(null)
const userStatuses = ref<ProjectUserRef[]>([])
const projectStatuses = ref<ProjectUserStatusType[]>([])
const userInfoCache = ref<Map<number, UserInfo>>(new Map())
const refreshInterval = ref<number | null>(null)

// Forms
const inviteForm = reactive({
  name: '',
  phone: ''
})

// Initialize settings
const getSettings = (): ProjectUserStatusSettings => {
  if (!props.element.ProjectUserStatus) {
    const defaultSettings: ProjectUserStatusSettings = {
      InviteText: 'Hi {{FriendName}}, {{Name}} would like to invite you. Go to {{InviteUrl}}',
      ConfirmText: 'Hi {{FriendName}}, you are invited by {{Name}}. Accept and continue to information page.',
      ConfirmedText: '{{FriendName}} has now registered.',
      ShowInvite: true,
      RowCount: 7
    }
    props.element.ProjectUserStatus = defaultSettings
  }
  return props.element.ProjectUserStatus
}

const settings = reactive(getSettings())

// Check if in edit mode
const isEditMode = computed(() => props.element.EditMode || false)

// Check if current user is admin
const isAdmin = computed(() => {
  return authStore.currentToken?.AccessLevelID === 1 || 
         authStore.currentToken?.userid === 4791748750 // Special admin ID from old code
})

// Get project ID (from element or URL)
const projectId = computed(() => {
  return props.element.projectid || parseInt(props.element.Settings?.object_1 || '0')
})

// Get current user ID
const currentUserId = computed(() => authStore.currentToken?.userid || 0)

// Status helpers
const getStatusById = (statusId: number) => {
  return projectStatuses.value.find(s => s.UserStatusID === statusId)
}

const getStatusIcon = (statusId: number) => {
  return getStatusById(statusId)?.icon || 'mdi-help-circle'
}

const getStatusColor = (statusId: number) => {
  return getStatusById(statusId)?.color || 'grey'
}

// Selected status for my status
const selectedStatusIcon = computed(() => {
  return myUserStatus.value ? getStatusIcon(myUserStatus.value.UserStatusID) : null
})

const selectedStatusColor = computed(() => {
  return myUserStatus.value ? getStatusColor(myUserStatus.value.UserStatusID) : null
})

// Status options for select
const statusOptions = computed(() => {
  return projectStatuses.value.map(status => ({
    ...status,
    title: status.Status,
    value: status.UserStatusID
  }))
})

// Status summary with counts
const statusSummary = computed(() => {
  const summary: ProjectUserStatusType[] = []
  
  // Clone and reset counts
  projectStatuses.value.forEach(status => {
    summary.push({
      ...status,
      UserCount: 0
    })
  })
  
  // Add "All" status
  const allStatus: ProjectUserStatusType = {
    SystemID: 0,
    UserStatusID: 0,
    Status: 'All Users',
    icon: 'mdi-account-group',
    color: 'primary',
    UserCount: 0
  }
  
  // Count users by status
  userStatuses.value.forEach(user => {
    const status = summary.find(s => s.UserStatusID === user.UserStatusID)
    if (status) {
      status.UserCount += 1 + user.ExtraGuests
    }
    allStatus.UserCount += 1 + user.ExtraGuests
  })
  
  // Add all status at beginning if has users
  if (allStatus.UserCount > 0) {
    summary.unshift(allStatus)
  }
  
  // Filter out empty statuses unless showing all
  return showAllUsers.value ? summary : summary.filter(s => s.UserCount > 0)
})

// Displayed users based on filters
const displayedUsers = computed(() => {
  let users = [...userStatuses.value]
  
  // Filter by status if not showing all
  if (!showAllUsers.value) {
    users = users.filter(u => u.UserStatusID !== 1) // Don't show "Not responded" by default
  }
  
  // Sort by status and name
  users.sort((a, b) => {
    if (a.UserStatusID !== b.UserStatusID) {
      return a.UserStatusID - b.UserStatusID
    }
    return getUserName(a.UserID).localeCompare(getUserName(b.UserID))
  })
  
  // Limit if not showing all
  if (!showAllUsers.value && settings.RowCount > 0) {
    return users.slice(0, settings.RowCount)
  }
  
  return users
})

// Check if there are more users
const hasMoreUsers = computed(() => {
  return !showAllUsers.value && userStatuses.value.length > settings.RowCount
})

const totalUsers = computed(() => userStatuses.value.length)

// User info helpers
const getUserName = (userId: number): string => {
  const info = userInfoCache.value.get(userId)
  return info?.Name || `User ${userId}`
}

const getUserPhone = (userId: number): string => {
  const info = userInfoCache.value.get(userId)
  return info?.Phone || `+${userId}`
}

const getUserEmail = (userId: number): string | undefined => {
  const info = userInfoCache.value.get(userId)
  return info?.Email
}

const getUserAvatar = (userId: number): string | undefined => {
  const info = userInfoCache.value.get(userId)
  return info?.Avatar
}

// Validation rules
const rules = {
  phone: (v: string) => {
    if (!v) return 'Phone number is required'
    const phoneRegex = /^\+?[0-9\s-]+$/
    return phoneRegex.test(v) || 'Invalid phone number format'
  }
}

// Methods
const loadData = async () => {
  if (!projectId.value) {
    console.error('No project ID provided')
    return
  }
  
  try {
    loading.value = true
    
    // Fetch project user status data
    const result = await executeSQLQueryWithCallback(
      '/components/ProjectUserStatus/getInfo',
      { ProjectID: projectId.value }
    )
    
    if (!result?.tables) {
      throw new Error('Invalid response format')
    }
    
    // Process user statuses (table 0)
    userStatuses.value = result.tables[0]?.rows || []
    
    // Process project status types (table 2)
    projectStatuses.value = result.tables[2]?.rows || []
    
    // Find current user's status
    myUserStatus.value = userStatuses.value.find(u => u.UserID === currentUserId.value) || null
    
    // Load user info (mock for now - in real app would come from cache)
    await loadUserInfo()
    
    // Show status change dialog if user hasn't responded
    if (myUserStatus.value?.UserStatusID === 1) {
      userDialog.value = true
      selectedUser.value = { ...myUserStatus.value }
    }
    
  } catch (error) {
    console.error('Failed to load project user status:', error)
    uiStore.showError('Failed to load project status')
  } finally {
    loading.value = false
  }
}

const loadUserInfo = async () => {
  // In real implementation, this would fetch from user cache
  // For now, generate mock data
  userStatuses.value.forEach(user => {
    if (!userInfoCache.value.has(user.UserID)) {
      userInfoCache.value.set(user.UserID, {
        UserID: user.UserID,
        Name: user.Name || `User ${user.UserID}`,
        Phone: `+${user.UserID}`,
        Email: `user${user.UserID}@example.com`
      })
    }
  })
}

const updateMyStatus = async () => {
  if (!myUserStatus.value || !projectId.value) return
  
  try {
    await executeSQLQueryWithCallback(
      '/components/ProjectUserStatus/SetStatus',
      {
        ProjectID: projectId.value,
        StatusID: myUserStatus.value.UserStatusID,
        ExtraGuests: myUserStatus.value.ExtraGuests || 0
      }
    )
    
    // Reload data to get updated counts
    await loadData()
    uiStore.showSuccess('Status updated')
  } catch (error) {
    console.error('Failed to update status:', error)
    uiStore.showError('Failed to update status')
  }
}

const openUserDialog = (user: ProjectUserRef) => {
  selectedUser.value = { ...user }
  userDialog.value = true
}

const saveUserStatus = async () => {
  if (!selectedUser.value || !projectId.value) return
  
  try {
    saving.value = true
    
    await executeSQLQueryWithCallback(
      '/components/ProjectUserStatus/SetStatusFriend',
      {
        ProjectID: projectId.value,
        StatusID: selectedUser.value.UserStatusID,
        ExtraGuests: selectedUser.value.ExtraGuests || 0,
        UserID: selectedUser.value.UserID
      }
    )
    
    // Update local data
    const index = userStatuses.value.findIndex(u => u.UserID === selectedUser.value!.UserID)
    if (index >= 0) {
      userStatuses.value[index] = { ...selectedUser.value }
    }
    
    userDialog.value = false
    await loadData()
    uiStore.showSuccess('User status updated')
  } catch (error) {
    console.error('Failed to save user status:', error)
    uiStore.showError('Failed to save user status')
  } finally {
    saving.value = false
  }
}

const removeUser = async () => {
  if (!selectedUser.value || !projectId.value || !confirm('Remove this user?')) return
  
  try {
    await executeSQLQueryWithCallback(
      '/components/ProjectUserStatus/RemoveUser',
      {
        ProjectID: projectId.value,
        UserID: selectedUser.value.UserID
      }
    )
    
    userDialog.value = false
    await loadData()
    uiStore.showSuccess('User removed')
  } catch (error) {
    console.error('Failed to remove user:', error)
    uiStore.showError('Failed to remove user')
  }
}

const inviteFriend = async () => {
  if (!projectId.value) return
  
  try {
    inviting.value = true
    
    // Clean phone number
    const cleanPhone = inviteForm.phone.replace(/\D/g, '')
    
    await executeSQLQueryWithCallback(
      '/components/ProjectUserStatus/Invite',
      {
        FriendTel: cleanPhone,
        FriendName: inviteForm.name,
        ProjectID: projectId.value,
        InviteText: settings.InviteText,
        ConfirmText: settings.ConfirmText,
        ConfirmedText: settings.ConfirmedText
      }
    )
    
    showInviteDialog.value = false
    inviteForm.name = ''
    inviteForm.phone = ''
    
    await loadData()
    uiStore.showSuccess('Invitation sent!')
  } catch (error) {
    console.error('Failed to invite friend:', error)
    uiStore.showError('Failed to send invitation')
  } finally {
    inviting.value = false
  }
}

const refreshData = () => {
  loadData()
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString()
}

// Watch for settings changes
watch(settings, (newSettings) => {
  props.element.ProjectUserStatus = { ...newSettings }
}, { deep: true })

// Auto-refresh every 30 seconds when not in edit mode
watch(isEditMode, (editMode) => {
  if (!editMode && !refreshInterval.value) {
    refreshInterval.value = window.setInterval(refreshData, 30000)
  } else if (editMode && refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
})

// Lifecycle
onMounted(() => {
  loadData()
  
  // Start auto-refresh if not in edit mode
  if (!isEditMode.value) {
    refreshInterval.value = window.setInterval(refreshData, 30000)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped>
.my-status-section {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-radius: 8px;
}

.status-summary {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

:deep(.v-theme--dark) .status-summary {
  background-color: rgba(255, 255, 255, 0.02);
}

.user-list {
  max-height: 400px;
  overflow-y: auto;
}

.invite-section {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

:deep(.v-theme--dark) .invite-section {
  background-color: rgba(255, 255, 255, 0.02);
}

.edit-controls {
  background-color: rgba(0, 0, 0, 0.02);
}

:deep(.v-theme--dark) .edit-controls {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>