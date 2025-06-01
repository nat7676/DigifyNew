<template>
  <Card 
    :title="element.title || 'User Profile'"
    :show-title="element.showHeader !== false"
  >
    <!-- Debug Info -->
    <div class="pa-4 text-center" style="background-color: #f0f0f0;">
      <p>UserProfile Component is Rendering!</p>
      <p>Element ID: {{ element.uniqueid }}</p>
      <p>Loading: {{ loading }}</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-3 text-body-2">Loading user profile...</p>
    </div>
    
    <!-- Profile Display -->
    <v-container v-if="userProfile" fluid>
      <v-row>
        <!-- Profile Image Section -->
        <v-col cols="12" md="3" class="text-center">
          <div class="profile-image-container">
            <v-avatar 
              size="150" 
              class="profile-avatar"
              :class="{ 'editable': hasEditAccess }"
              @click="hasEditAccess && showImageDialog ? showImageDialog = true : null"
            >
              <v-img 
                v-if="profileImageUrl"
                :src="profileImageUrl"
                :alt="userProfile.FirstName + ' ' + userProfile.LastName"
              />
              <v-icon v-else size="80" color="grey">
                mdi-account-circle
              </v-icon>
              
              <!-- Edit overlay -->
              <div v-if="hasEditAccess" class="avatar-overlay">
                <v-icon color="white">mdi-camera</v-icon>
              </div>
            </v-avatar>
            
            <!-- Online Status -->
            <v-badge
              v-if="showOnlineStatus"
              :color="isOnline ? 'success' : 'grey'"
              dot
              bordered
              location="bottom end"
              offset-x="30"
              offset-y="30"
            />
          </div>
          
          <h3 class="mt-3 text-h6">
            {{ userProfile.FirstName }} {{ userProfile.LastName }}
          </h3>
          <p class="text-body-2 text-grey">
            +{{ userProfile.Tel }}
          </p>
          
          <!-- User badges -->
          <div class="mt-2">
            <v-chip
              v-if="isCurrentUser"
              color="primary"
              size="small"
              label
              class="mr-1"
            >
              <v-icon start size="small">mdi-account-check</v-icon>
              You
            </v-chip>
            <v-chip
              v-if="userProfile.AccessLevelID >= 90"
              color="error"
              size="small"
              label
            >
              <v-icon start size="small">mdi-shield-crown</v-icon>
              Admin
            </v-chip>
          </div>
        </v-col>
        
        <!-- Profile Information -->
        <v-col cols="12" md="9">
          <!-- Edit Form -->
          <v-form v-if="isEditMode && hasEditAccess" @submit.prevent="saveProfile">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.FirstName"
                  label="First Name"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.LastName"
                  label="Last Name"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.Email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.email]"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.LinkedInUserName"
                  label="LinkedIn Username"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-linkedin"
                  placeholder="john-doe"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.Company"
                  label="Company"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editForm.JobTitle"
                  label="Job Title"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editForm.Bio"
                  label="Bio"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  counter
                  maxlength="500"
                />
              </v-col>
            </v-row>
            
            <!-- Form Actions -->
            <div class="d-flex justify-end gap-2 mt-4">
              <v-btn
                variant="text"
                @click="cancelEdit"
              >
                Cancel
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                type="submit"
                :loading="saving"
              >
                Save Changes
              </v-btn>
            </div>
          </v-form>
          
          <!-- Display Mode -->
          <div v-else>
            <v-list density="compact" class="profile-info-list">
              <v-list-item v-if="userProfile.Email">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-email</v-icon>
                </template>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>
                  <a :href="`mailto:${userProfile.Email}`">{{ userProfile.Email }}</a>
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-phone</v-icon>
                </template>
                <v-list-item-title>Phone</v-list-item-title>
                <v-list-item-subtitle>+{{ userProfile.Tel }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="userProfile.LinkedInUserName">
                <template v-slot:prepend>
                  <v-icon size="small" color="#0077B5">mdi-linkedin</v-icon>
                </template>
                <v-list-item-title>LinkedIn</v-list-item-title>
                <v-list-item-subtitle>
                  <a 
                    :href="`https://linkedin.com/in/${userProfile.LinkedInUserName}`"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ userProfile.LinkedInUserName }}
                  </a>
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="userProfile.Company">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-domain</v-icon>
                </template>
                <v-list-item-title>Company</v-list-item-title>
                <v-list-item-subtitle>{{ userProfile.Company }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="userProfile.JobTitle">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-briefcase</v-icon>
                </template>
                <v-list-item-title>Job Title</v-list-item-title>
                <v-list-item-subtitle>{{ userProfile.JobTitle }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="userProfile.Bio">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-text</v-icon>
                </template>
                <v-list-item-title>About</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">{{ userProfile.Bio }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <!-- Action Buttons -->
            <div v-if="hasEditAccess" class="mt-6">
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-pencil"
                @click="isEditMode = true"
              >
                Edit Profile
              </v-btn>
              
              <v-btn
                v-if="isCurrentUser"
                color="error"
                variant="text"
                class="ml-2"
                @click="showDeleteDialog = true"
              >
                Delete Account
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Empty State -->
    <div v-else-if="!loading" class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-account-off-outline
      </v-icon>
      <p class="text-h6 text-grey-darken-1">
        User profile not found
      </p>
    </div>
    
    <!-- Edit Mode Settings (for module configuration) -->
    <template v-if="element.EditMode">
      <v-divider class="my-4" />
      <div class="edit-controls pa-4">
        <p class="text-subtitle-2 mb-3">Module Settings</p>
        
        <TextField
          v-model.number="settings.DefaultUserId"
          label="Default User ID (leave empty for current user)"
          type="number"
          class="mb-3"
        />
        
        <CheckBox
          v-model="settings.ShowOnlineStatus"
          label="Show online status indicator"
          class="mb-2"
        />
        
        <CheckBox
          v-model="settings.AllowProfileImageUpload"
          label="Allow profile image upload"
          class="mb-2"
        />
        
        <CheckBox
          v-model="settings.ShowExtendedInfo"
          label="Show extended information (company, job title, bio)"
        />
      </div>
    </template>
    
    <!-- Delete Account Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 text-error">
          Delete Account?
        </v-card-title>
        <v-card-text>
          <v-alert type="error" variant="tonal" class="mb-4">
            <v-alert-title>This action cannot be undone!</v-alert-title>
            Your account and all personal information will be permanently deleted.
          </v-alert>
          <p>
            Are you absolutely sure you want to delete your account?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleting"
            @click="deleteAccount"
          >
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Account Deleted Dialog -->
    <v-dialog v-model="accountDeleted" persistent max-width="400">
      <v-card>
        <v-card-title>Account Deleted</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal">
            Your account has been deleted. You will be logged out in a moment.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Profile Image Upload Dialog -->
    <v-dialog v-model="showImageDialog" max-width="500">
      <v-card>
        <v-card-title>
          Change Profile Picture
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showImageDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-4">
            Upload a new profile picture or enter an image URL
          </p>
          
          <v-tabs v-model="imageTab" class="mb-4">
            <v-tab value="upload" disabled>
              Upload
              <v-chip size="x-small" class="ml-2">Coming Soon</v-chip>
            </v-tab>
            <v-tab value="url">URL</v-tab>
          </v-tabs>
          
          <v-window v-model="imageTab">
            <v-window-item value="url">
              <v-text-field
                v-model="imageUrl"
                label="Image URL"
                variant="outlined"
                density="compact"
                placeholder="https://example.com/profile.jpg"
              />
              
              <div v-if="imageUrl" class="mt-4">
                <p class="text-subtitle-2 mb-2">Preview</p>
                <v-avatar size="120" class="mx-auto d-block">
                  <v-img :src="imageUrl" />
                </v-avatar>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showImageDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            :disabled="!imageUrl"
            @click="updateProfileImage"
          >
            Update
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import TextField from '@/components/ui/TextField.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import { executeSQLQueryWithCallback } from '@/services/sql.service'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { fetchAllRelatedUsersFromCache } from '@/modules/shared/sharedhelpers'
import type { AllRelatedUsersCacheType, DashboardElement } from '@/modules/shared/shared'

// Extended user profile interface
interface UserProfileData extends AllRelatedUsersCacheType {
  Company?: string
  JobTitle?: string
  Bio?: string
  ProfileImageUrl?: string
}

interface UserProfileSettings {
  DefaultUserId?: number
  ShowOnlineStatus: boolean
  AllowProfileImageUpload: boolean
  ShowExtendedInfo: boolean
}

interface Props {
  element: DashboardElement & {
    title?: string
    showHeader?: boolean
    EditMode?: boolean
    UserProfile?: UserProfileSettings
  }
  settings?: Record<string, any>
  minimized?: boolean
  userid?: number
}

const props = defineProps<Props>()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Debug logging
console.log('UserProfile component initialized with props:', props)

// State
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const userProfile = ref<UserProfileData | null>(null)
const isEditMode = ref(false)
const showDeleteDialog = ref(false)
const accountDeleted = ref(false)
const showImageDialog = ref(false)
const imageTab = ref('url')
const imageUrl = ref('')
const allUsers = ref<{ [Tel: number]: AllRelatedUsersCacheType }>({})

// Form data
const editForm = reactive({
  FirstName: '',
  LastName: '',
  Email: '',
  LinkedInUserName: '',
  Company: '',
  JobTitle: '',
  Bio: ''
})

// Initialize settings
const getSettings = (): UserProfileSettings => {
  if (!props.element.UserProfile) {
    const defaultSettings: UserProfileSettings = {
      DefaultUserId: undefined,
      ShowOnlineStatus: true,
      AllowProfileImageUpload: true,
      ShowExtendedInfo: true
    }
    props.element.UserProfile = defaultSettings
  }
  return props.element.UserProfile
}

const settings = reactive(getSettings())

// Computed
const targetUserId = computed(() => {
  // Priority: prop > settings > current user
  return props.userid || settings.DefaultUserId || authStore.currentToken?.userid || 0
})

const isCurrentUser = computed(() => {
  return targetUserId.value === authStore.currentToken?.userid
})

const hasEditAccess = computed(() => {
  const currentUser = authStore.currentToken
  if (!currentUser) return false
  
  // User can edit their own profile
  if (isCurrentUser.value) return true
  
  // Admins can edit any profile
  return currentUser.AccessLevelID >= 90
})

const cardTitle = computed(() => {
  if (props.element.title) return props.element.title
  if (!userProfile.value) return 'User Profile'
  return `${userProfile.value.FirstName} ${userProfile.value.LastName}`
})

const profileImageUrl = computed(() => {
  if (userProfile.value?.ProfileImageUrl) return userProfile.value.ProfileImageUrl
  // Could integrate with profile image service here
  return null
})

const isOnline = computed(() => {
  // This would be determined by checking user activity
  // For now, current user is always online
  return isCurrentUser.value
})

const showOnlineStatus = computed(() => {
  return settings.ShowOnlineStatus && !props.element.EditMode
})

// Validation rules
const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => {
    if (!v) return true
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Invalid email'
  }
}

// Methods
const loadUserProfile = async () => {
  loading.value = true
  
  try {
    // Load all users cache
    allUsers.value = await fetchAllRelatedUsersFromCache()
    
    // Get user from cache
    const cachedUser = allUsers.value[targetUserId.value]
    
    if (cachedUser) {
      // Load extended profile data if available
      try {
        const result = await executeSQLQueryWithCallback(
          '/components/UserProfile/GetExtended',
          { UserID: targetUserId.value }
        )
        
        if (result?.tables?.[0]?.rows?.[0]) {
          userProfile.value = {
            ...cachedUser,
            ...result.tables[0].rows[0]
          }
        } else {
          userProfile.value = cachedUser
        }
      } catch {
        // Fall back to cached data
        userProfile.value = cachedUser
      }
      
      // Initialize edit form
      initializeEditForm()
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
    uiStore.showError('Failed to load user profile')
  } finally {
    loading.value = false
  }
}

const initializeEditForm = () => {
  if (!userProfile.value) return
  
  editForm.FirstName = userProfile.value.FirstName || ''
  editForm.LastName = userProfile.value.LastName || ''
  editForm.Email = userProfile.value.Email || ''
  editForm.LinkedInUserName = userProfile.value.LinkedInUserName || ''
  editForm.Company = userProfile.value.Company || ''
  editForm.JobTitle = userProfile.value.JobTitle || ''
  editForm.Bio = userProfile.value.Bio || ''
}

const saveProfile = async () => {
  saving.value = true
  
  try {
    await executeSQLQueryWithCallback(
      '/components/UserProfile/Save',
      {
        UserID: targetUserId.value,
        ...editForm
      }
    )
    
    // Update local cache
    if (userProfile.value) {
      Object.assign(userProfile.value, editForm)
      
      // Update global cache
      const cachedUser = allUsers.value[targetUserId.value]
      if (cachedUser) {
        cachedUser.FirstName = editForm.FirstName
        cachedUser.LastName = editForm.LastName
        cachedUser.Email = editForm.Email
        cachedUser.LinkedInUserName = editForm.LinkedInUserName
      }
    }
    
    isEditMode.value = false
    uiStore.showSuccess('Profile updated successfully')
  } catch (error) {
    console.error('Failed to save profile:', error)
    uiStore.showError('Failed to save profile')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  initializeEditForm()
  isEditMode.value = false
}

const updateProfileImage = async () => {
  if (!imageUrl.value) return
  
  try {
    await executeSQLQueryWithCallback(
      '/components/UserProfile/UpdateImage',
      {
        UserID: targetUserId.value,
        ImageUrl: imageUrl.value
      }
    )
    
    if (userProfile.value) {
      userProfile.value.ProfileImageUrl = imageUrl.value
    }
    
    showImageDialog.value = false
    imageUrl.value = ''
    uiStore.showSuccess('Profile picture updated')
  } catch (error) {
    console.error('Failed to update profile image:', error)
    uiStore.showError('Failed to update profile picture')
  }
}

const deleteAccount = async () => {
  if (!isCurrentUser.value) return
  
  deleting.value = true
  
  try {
    await executeSQLQueryWithCallback(
      '/User/DeleteAccount',
      { UserID: targetUserId.value }
    )
    
    showDeleteDialog.value = false
    accountDeleted.value = true
    
    // Log out after 2 seconds
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 2000)
  } catch (error) {
    console.error('Failed to delete account:', error)
    uiStore.showError('Failed to delete account')
  } finally {
    deleting.value = false
  }
}

// Watch for user ID changes
watch(targetUserId, (newId) => {
  if (newId) {
    loadUserProfile()
  }
})

// Watch for settings changes
watch(settings, (newSettings) => {
  props.element.UserProfile = { ...newSettings }
}, { deep: true })

// Lifecycle
onMounted(() => {
  console.log('UserProfile mounted, loading user profile for ID:', targetUserId.value)
  console.log('Element prop:', props.element)
  loadUserProfile()
})
</script>

<style scoped>
.profile-image-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  transition: all 0.3s ease;
}

.profile-avatar.editable {
  cursor: pointer;
}

.profile-avatar.editable:hover {
  transform: scale(1.05);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.profile-avatar.editable:hover .avatar-overlay {
  opacity: 1;
}

.profile-info-list {
  background: transparent;
}

.edit-controls {
  background-color: rgba(0, 0, 0, 0.02);
}

:deep(.v-theme--dark) .edit-controls {
  background-color: rgba(255, 255, 255, 0.02);
}

.gap-2 {
  gap: 8px;
}
</style>