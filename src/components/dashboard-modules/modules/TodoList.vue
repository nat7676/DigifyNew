<template>
  <DashboardCard 
    :title="element.title || 'Todo List'"
    :show-title="element.showHeader !== false"
    :dense="true"
    :element="element"
  >
    <!-- Header Actions -->
    <template v-if="!isEditMode && todoList" #append>
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
          <v-list-item @click="showCompleted = !showCompleted">
            <v-list-item-title>
              {{ showCompleted ? 'Hide' : 'Show' }} Completed
            </v-list-item-title>
            <template v-slot:prepend>
              <v-icon>{{ showCompleted ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="showStats = true">
            <v-list-item-title>Statistics</v-list-item-title>
            <template v-slot:prepend>
              <v-icon>mdi-chart-bar</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    
    <!-- Progress Bar -->
    <v-progress-linear
      v-if="todoList && progress > 0"
      :model-value="progress"
      color="success"
      height="4"
      class="mb-3"
    />
    
    <!-- Todo List -->
    <div v-if="todoList" class="todo-list-container">
      <!-- Empty State -->
      <div v-if="filteredItems.length === 0 && !showAddNew" class="empty-state pa-6 text-center">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">
          {{ showCompleted ? 'mdi-checkbox-marked-circle-outline' : 'mdi-format-list-checks' }}
        </v-icon>
        <p class="text-body-1 text-grey-darken-1 mb-3">
          {{ showCompleted ? 'No tasks yet' : 'All tasks completed! 🎉' }}
        </p>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="showAddNew = true"
        >
          Add First Task
        </v-btn>
      </div>
      
      <!-- Todo Items -->
      <v-slide-y-transition group>
        <todo-item
          v-for="item in filteredItems"
          :key="item.id"
          :item="item"
          :level="0"
          :show-completed="showCompleted"
          @update="updateItem"
          @delete="deleteItem"
          @add-child="addChildItem"
        />
      </v-slide-y-transition>
      
      <!-- Add New Item -->
      <v-slide-y-transition>
        <div v-if="showAddNew" class="add-new-container mt-3">
          <v-text-field
            v-model="newItemText"
            :loading="addingItem"
            variant="outlined"
            density="compact"
            placeholder="Add a new task..."
            prepend-inner-icon="mdi-plus"
            hide-details
            autofocus
            @keyup.enter="addNewItem"
            @keyup.esc="cancelAddNew"
          >
            <template v-slot:append>
              <v-btn
                icon="mdi-check"
                size="small"
                variant="text"
                color="success"
                :disabled="!newItemText.trim()"
                @click="addNewItem"
              />
              <v-btn
                icon="mdi-close"
                size="small"
                variant="text"
                @click="cancelAddNew"
              />
            </template>
          </v-text-field>
        </div>
      </v-slide-y-transition>
      
      <!-- Add Button -->
      <v-btn
        v-if="!showAddNew && filteredItems.length > 0"
        variant="text"
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        class="mt-2"
        @click="showAddNew = true"
      >
        Add Task
      </v-btn>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="loading" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-3 text-body-2">Loading tasks...</p>
    </div>
    
    <!-- Edit Mode -->
    <template v-if="isEditMode">
      <v-divider class="my-4" />
      <div class="edit-controls">
        <p class="text-subtitle-2 mb-3">List Settings</p>
        
        <TextField
          v-model="todoSettings.listName"
          label="List Name"
          placeholder="My Todo List"
          class="mb-3"
        />
        
        <CheckBox
          v-model="todoSettings.showProgress"
          label="Show progress bar"
          class="mb-2"
        />
        
        <CheckBox
          v-model="todoSettings.allowSubtasks"
          label="Allow subtasks"
          class="mb-2"
        />
        
        <CheckBox
          v-model="todoSettings.showDueDates"
          label="Show due dates"
          class="mb-2"
        />
        
        <CheckBox
          v-model="todoSettings.privateList"
          label="Private list (only visible to you)"
        />
      </div>
    </template>
    
    <!-- Statistics Dialog -->
    <v-dialog v-model="showStats" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-chart-bar</v-icon>
          Task Statistics
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="6">
              <div class="stat-item">
                <div class="stat-value text-h3">{{ stats.total }}</div>
                <div class="stat-label text-body-2 text-grey">Total Tasks</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-item">
                <div class="stat-value text-h3 text-success">{{ stats.completed }}</div>
                <div class="stat-label text-body-2 text-grey">Completed</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-item">
                <div class="stat-value text-h3 text-warning">{{ stats.pending }}</div>
                <div class="stat-label text-body-2 text-grey">Pending</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-item">
                <div class="stat-value text-h3 text-info">{{ Math.round(progress) }}%</div>
                <div class="stat-label text-body-2 text-grey">Progress</div>
              </div>
            </v-col>
          </v-row>
          
          <v-divider class="my-4" />
          
          <div class="text-center">
            <v-progress-circular
              :model-value="progress"
              :size="120"
              :width="12"
              color="primary"
            >
              <span class="text-h5">{{ Math.round(progress) }}%</span>
            </v-progress-circular>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showStats = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </DashboardCard>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import Card from '@/components/ui/Card.vue'
import TextField from '@/components/ui/TextField.vue'
import CheckBox from '@/components/ui/CheckBox.vue'
import TodoItem from './TodoItem.vue'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  parentId?: string
  children: TodoItem[]
  createdAt: Date
  completedAt?: Date
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  notes?: string
}

interface TodoListSettings {
  listId?: string
  listName: string
  showProgress: boolean
  allowSubtasks: boolean
  showDueDates: boolean
  privateList: boolean
}

interface DashboardElement {
  uniqueid: string
  element: string
  title?: string
  showHeader?: boolean
  EditMode?: boolean
  TodoList?: TodoListSettings
  contentid?: string
  [key: string]: any
}

interface Props {
  element: DashboardElement
  settings?: Record<string, any>
  minimized?: boolean
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const todoList = ref<TodoItem[]>([])
const showAddNew = ref(false)
const newItemText = ref('')
const addingItem = ref(false)
const showCompleted = ref(true)
const showStats = ref(false)

// Initialize settings
const getSettings = (): TodoListSettings => {
  if (!props.element.TodoList) {
    const defaultSettings: TodoListSettings = {
      listId: props.element.contentid,
      listName: 'My Todo List',
      showProgress: true,
      allowSubtasks: true,
      showDueDates: true,
      privateList: false
    }
    props.element.TodoList = defaultSettings
  }
  return props.element.TodoList
}

const todoSettings = reactive(getSettings())

// Check if in edit mode
const isEditMode = computed(() => props.element.EditMode || false)

// Filtered items based on show completed setting
const filteredItems = computed(() => {
  if (showCompleted.value) {
    return todoList.value
  }
  return filterIncomplete(todoList.value)
})

// Filter incomplete items recursively
const filterIncomplete = (items: TodoItem[]): TodoItem[] => {
  return items
    .filter(item => !item.completed)
    .map(item => ({
      ...item,
      children: filterIncomplete(item.children)
    }))
}

// Calculate progress
const progress = computed(() => {
  const { completed, total } = countTasks(todoList.value)
  return total > 0 ? (completed / total) * 100 : 0
})

// Calculate statistics
const stats = computed(() => {
  const { completed, total } = countTasks(todoList.value)
  return {
    total,
    completed,
    pending: total - completed
  }
})

// Count tasks recursively
const countTasks = (items: TodoItem[]): { completed: number; total: number } => {
  let completed = 0
  let total = 0
  
  const count = (items: TodoItem[]) => {
    items.forEach(item => {
      total++
      if (item.completed) completed++
      if (item.children.length > 0) {
        count(item.children)
      }
    })
  }
  
  count(items)
  return { completed, total }
}

// Generate unique ID
const generateId = (): string => {
  return `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Load todo list data
const loadTodoList = async () => {
  loading.value = true
  
  // Simulate loading from API
  // In real implementation, this would fetch from backend
  setTimeout(() => {
    // Load from localStorage for demo
    const savedData = localStorage.getItem(`todoList-${todoSettings.listId || 'default'}`)
    if (savedData) {
      todoList.value = JSON.parse(savedData)
    } else {
      // Demo data
      todoList.value = [
        {
          id: generateId(),
          text: 'Welcome to your new todo list!',
          completed: false,
          children: [],
          createdAt: new Date()
        },
        {
          id: generateId(),
          text: 'Click the checkbox to complete tasks',
          completed: true,
          children: [],
          createdAt: new Date(),
          completedAt: new Date()
        },
        {
          id: generateId(),
          text: 'Add new tasks with the button below',
          completed: false,
          children: [
            {
              id: generateId(),
              text: 'Subtasks are supported!',
              completed: false,
              children: [],
              createdAt: new Date()
            }
          ],
          createdAt: new Date()
        }
      ]
    }
    loading.value = false
  }, 500)
}

// Save todo list data
const saveTodoList = () => {
  // In real implementation, this would save to backend
  localStorage.setItem(
    `todoList-${todoSettings.listId || 'default'}`,
    JSON.stringify(todoList.value)
  )
}

// Add new item
const addNewItem = async () => {
  if (!newItemText.value.trim()) return
  
  addingItem.value = true
  
  const newItem: TodoItem = {
    id: generateId(),
    text: newItemText.value.trim(),
    completed: false,
    children: [],
    createdAt: new Date()
  }
  
  todoList.value.push(newItem)
  saveTodoList()
  
  newItemText.value = ''
  showAddNew.value = false
  addingItem.value = false
}

// Cancel adding new item
const cancelAddNew = () => {
  newItemText.value = ''
  showAddNew.value = false
}

// Update item
const updateItem = (item: TodoItem) => {
  const updateInList = (items: TodoItem[]): boolean => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === item.id) {
        items[i] = { ...item }
        if (item.completed && !items[i].completedAt) {
          items[i].completedAt = new Date()
        } else if (!item.completed) {
          items[i].completedAt = undefined
        }
        return true
      }
      if (items[i].children.length > 0) {
        if (updateInList(items[i].children)) return true
      }
    }
    return false
  }
  
  updateInList(todoList.value)
  saveTodoList()
}

// Delete item
const deleteItem = (itemId: string) => {
  const deleteFromList = (items: TodoItem[]): boolean => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        items.splice(i, 1)
        return true
      }
      if (items[i].children.length > 0) {
        if (deleteFromList(items[i].children)) return true
      }
    }
    return false
  }
  
  deleteFromList(todoList.value)
  saveTodoList()
}

// Add child item
const addChildItem = (parentId: string, text: string) => {
  const addToParent = (items: TodoItem[]): boolean => {
    for (const item of items) {
      if (item.id === parentId) {
        item.children.push({
          id: generateId(),
          text,
          completed: false,
          parentId,
          children: [],
          createdAt: new Date()
        })
        return true
      }
      if (item.children.length > 0) {
        if (addToParent(item.children)) return true
      }
    }
    return false
  }
  
  addToParent(todoList.value)
  saveTodoList()
}

// Watch for settings changes
watch(todoSettings, (newSettings) => {
  props.element.TodoList = { ...newSettings }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadTodoList()
})
</script>

<style scoped>
.todo-list-container {
  min-height: 200px;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.add-new-container {
  padding: 0 8px;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-weight: 300;
  margin-bottom: 4px;
}

.stat-label {
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.edit-controls {
  padding: 0;
}
</style>