<template>
  <DashboardCard 
    :element="element"
    :loading="loading"
  >
  
    <!-- Debug: Show Project ID (can be removed in production) -->
    <v-chip 
      v-if="projectid"
      size="small"
      variant="tonal"
      class="mb-2"
    >
      Project ID: {{ projectid }}
    </v-chip>
    <div v-if="projectSettings" class="pa-4">
      <v-text-field
        v-model="projectSettings.Title"
        label="Project Title"
        variant="outlined"
        density="compact"
        class="mb-4"
      />
      
      <v-checkbox
        v-model="projectSettings.DuplicateUsers"
        label="Duplicate Users"
        density="compact"
        hide-details
        class="mb-4"
      />
      
      <v-text-field
        v-model="formattedDate"
        label="Follow-up Date"
        type="datetime-local"
        variant="outlined"
        density="compact"
        class="mb-4"
      />
      
      <v-btn
        color="primary"
        variant="flat"
        block
        size="large"
        :loading="saving"
        @click="duplicateProject"
      >
        <v-icon start>mdi-content-duplicate</v-icon>
        Duplicate Project
      </v-btn>
    </div>
    
    <v-alert
      v-else-if="!loading && !projectSettings"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      Unable to load project data
    </v-alert>
  </DashboardCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardCard from '@/components/ui/DashboardCard.vue'
import { executeSQLQueryWithCallback } from '@/services/sql.service'
import { ObjectTypeEnum, ObjectSettingsTypeEnum } from '@/modules/shared/shared'
import { useUIStore } from '@/stores/ui'
import type { DashboardElement } from '@/types/shared'

interface ProjectDuplicateType {
  FromProjectID: number
  Title: string
  FollowUpDate: Date
  DuplicateUsers: boolean
  CmNo: number
}

interface ObjectSettingRefValueType {
  Value: string
}

interface ObjectItemType {
  ObjectID: number
  Settings?: {
    [SettingID in ObjectSettingsTypeEnum]?: ObjectSettingRefValueType
  }
  ParentObjectTypeID?: number
  ParentObjectID?: number
  ChangedWhen?: Date
  CreatedWhen?: Date
}

interface Props {
  element: DashboardElement & {
    projectid?: number
  }
  projectid?: number
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()

// State
const loading = ref(true)
const saving = ref(false)
const projectSettings = ref<ProjectDuplicateType | null>(null)

// Extract projectId from URL dynamically
const projectid = computed(() => {
  // First check props
  if (props.projectid) return props.projectid
  if (props.element.projectid) return props.element.projectid
  
  // Then check if we're on a project route
  if (route.path.includes('/project/')) {
    // Extract from path: /insight/project/14038
    const match = route.path.match(/\/project\/(\d+)/)
    return match ? Number(match[1]) : null
  }
  
  // Also check route params (if defined in router)
  return route.params.projectId ? Number(route.params.projectId) : null
})

// Computed properties
const formattedDate = computed({
  get: () => {
    if (!projectSettings.value?.FollowUpDate) return ''
    const date = new Date(projectSettings.value.FollowUpDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  },
  set: (value: string) => {
    if (projectSettings.value && value) {
      projectSettings.value.FollowUpDate = new Date(value)
    }
  }
})

// Helper functions
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const getSettingValueByID = (
  settings: ObjectItemType['Settings'],
  settingID: ObjectSettingsTypeEnum
): string | null => {
  if (!settings) return null
  const setting = settings[settingID]
  return setting?.Value || null
}

// Fetch project data
const fetchProjectData = async (projectId: number) => {
  try {
    loading.value = true
    console.log('fetchProjectData', ObjectTypeEnum.Project, projectId);
    // Fetch object with settings
    const response = await executeSQLQueryWithCallback(
      '/components/ObjectSetting/getObjectByType',
      {
        ObjectTypeID: ObjectTypeEnum.Project,
        ObjectID: projectId
      },
      { array: true }
    )
    console.log(response);
    
    if (response.tables?.[0]?.rows?.length > 0) {
      // Parse array response format
      const rows = response.tables[0].rows as [
        number, // ObjectID
        number, // SettingID
        string, // Value
        number, // ParentObjectTypeID
        number, // ParentObjectID
        Date,   // ChangedWhen
        Date    // CreatedWhen
      ][]
      
      // Build object from rows
      const objectsRef: { [ObjectID: number]: ObjectItemType } = {}
      rows.forEach((row) => {
        const [
          ObjectID,
          SettingID,
          Value,
          ParentObjectTypeID,
          ParentObjectID,
          ChangedWhen,
          CreatedWhen
        ] = row
        
        if (!objectsRef[ObjectID]) {
          objectsRef[ObjectID] = {
            ObjectID,
            Settings: {},
            ParentObjectTypeID,
            ParentObjectID,
            ChangedWhen,
            CreatedWhen
          }
        }
        
        if (objectsRef[ObjectID].Settings) {
          objectsRef[ObjectID].Settings![SettingID as ObjectSettingsTypeEnum] = {
            Value
          }
        }
      })
      
      // Get the first (and should be only) object
      const project = Object.values(objectsRef)[0]
      if (!project) return
      
      // Extract settings
      const followUpDateStr = getSettingValueByID(
        project.Settings,
        ObjectSettingsTypeEnum.FollowUpDate
      )
      const followUpDate = followUpDateStr 
        ? new Date(followUpDateStr)
        : new Date()
      
      const cmNo = getSettingValueByID(
        project.Settings,
        ObjectSettingsTypeEnum.CmNo
      )
      const title = getSettingValueByID(
        project.Settings,
        ObjectSettingsTypeEnum.Title
      )
      
      // Set up duplication settings
      projectSettings.value = {
        FromProjectID: project.ObjectID,
        CmNo: cmNo ? Number(cmNo) : 0,
        Title: title || 'Copy of Project',
        FollowUpDate: addDays(followUpDate, 7),
        DuplicateUsers: true
      }
    }
  } catch (error) {
    console.error('Failed to fetch project data:', error)
    uiStore.showError('Failed to load project data')
  } finally {
    loading.value = false
  }
}

// Duplicate project
const duplicateProject = async () => {
  if (!projectSettings.value) return
  
  try {
    saving.value = true
    
    const response = await executeSQLQueryWithCallback(
      '/components/project/duplicate',
      projectSettings.value,
      {}
    )
    
    if (response.tables?.[0]?.rows?.[0]) {
      const newProject = response.tables[0].rows[0] as { ObjectID: number }
      uiStore.showSuccess('Project duplicated successfully')
      
      // Navigate to the new project
      await router.push(`/insight/project/${newProject.ObjectID}`)
    } else {
      throw new Error('No project returned from duplication')
    }
  } catch (error) {
    console.error('Failed to duplicate project:', error)
    uiStore.showError('Failed to duplicate project')
  } finally {
    saving.value = false
  }
}

// Watch for project ID changes
watch(
  projectid,
  (newProjectId) => {
    if (newProjectId) {
      void fetchProjectData(newProjectId)
    } else {
      loading.value = false
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  if (!projectid.value) {
    loading.value = false
    uiStore.showError('No project ID found in URL or props')
  }
})
</script>

<style scoped>
:deep(.v-input--density-compact) {
  margin-bottom: 0;
}
</style>