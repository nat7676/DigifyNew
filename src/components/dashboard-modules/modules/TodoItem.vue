<template>
  <div class="todo-item-wrapper">
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <div
        class="todo-item"
        :class="{
          'completed': item.completed,
          'has-children': item.children.length > 0,
          'is-expanded': isExpanded
        }"
        :style="{ paddingLeft: (level * 32) + 'px' }"
        v-bind="hoverProps"
      >
        <!-- Drag Handle -->
        <v-icon
          v-if="isHovering && level === 0"
          size="small"
          class="drag-handle"
          :style="{ opacity: isHovering ? 0.6 : 0 }"
        >
          mdi-drag
        </v-icon>
        
        <!-- Expand/Collapse -->
        <v-btn
          v-if="item.children.length > 0"
          icon
          size="x-small"
          variant="text"
          class="expand-btn"
          @click="isExpanded = !isExpanded"
        >
          <v-icon size="small">
            {{ isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
          </v-icon>
        </v-btn>
        <div v-else class="expand-spacer"></div>
        
        <!-- Checkbox -->
        <v-checkbox
          :model-value="item.completed"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="toggleComplete"
        />
        
        <!-- Content -->
        <div class="todo-content" @click="startEdit">
          <input
            v-if="isEditing"
            v-model="editText"
            class="edit-input"
            @blur="saveEdit"
            @keyup.enter="saveEdit"
            @keyup.esc="cancelEdit"
            @click.stop
            ref="editInput"
          />
          <span v-else class="todo-text">
            {{ item.text }}
          </span>
          
          <!-- Due Date -->
          <v-chip
            v-if="item.dueDate"
            size="x-small"
            :color="dueDateColor"
            class="ml-2"
          >
            <v-icon start size="x-small">mdi-calendar</v-icon>
            {{ formatDueDate(item.dueDate) }}
          </v-chip>
          
          <!-- Priority -->
          <v-icon
            v-if="item.priority === 'high'"
            size="small"
            color="error"
            class="ml-1"
          >
            mdi-flag
          </v-icon>
          <v-icon
            v-else-if="item.priority === 'medium'"
            size="small"
            color="warning"
            class="ml-1"
          >
            mdi-flag
          </v-icon>
          
          <!-- Notes indicator -->
          <v-icon
            v-if="item.notes"
            size="small"
            color="grey"
            class="ml-1"
          >
            mdi-note-text
          </v-icon>
        </div>
        
        <!-- Actions -->
        <div class="todo-actions" :style="{ opacity: isHovering ? 1 : 0 }">
          <v-menu>
            <template v-slot:activator="{ props: menuProps }">
              <v-btn
                icon="mdi-dots-vertical"
                size="x-small"
                variant="text"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            <v-list density="compact">
              <v-list-item @click="showDetails = true">
                <v-list-item-title>Edit Details</v-list-item-title>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-pencil</v-icon>
                </template>
              </v-list-item>
              <v-list-item @click="addSubtask">
                <v-list-item-title>Add Subtask</v-list-item-title>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-subdirectory-arrow-right</v-icon>
                </template>
              </v-list-item>
              <v-divider />
              <v-list-item @click="deleteItem" class="text-error">
                <v-list-item-title>Delete</v-list-item-title>
                <template v-slot:prepend>
                  <v-icon size="small" color="error">mdi-delete</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-hover>
    
    <!-- Children -->
    <v-expand-transition>
      <div v-if="isExpanded && item.children.length > 0">
        <todo-item
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :level="level + 1"
          :show-completed="showCompleted"
          @update="$emit('update', $event)"
          @delete="$emit('delete', $event)"
          @add-child="$emit('add-child', $event)"
        />
      </div>
    </v-expand-transition>
    
    <!-- Add Subtask Input -->
    <v-slide-y-transition>
      <div v-if="showAddSubtask" class="add-subtask" :style="{ paddingLeft: ((level + 1) * 32) + 'px' }">
        <v-text-field
          v-model="subtaskText"
          variant="outlined"
          density="compact"
          placeholder="Add subtask..."
          hide-details
          autofocus
          @keyup.enter="confirmAddSubtask"
          @keyup.esc="cancelAddSubtask"
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-check"
              size="x-small"
              variant="text"
              color="success"
              :disabled="!subtaskText.trim()"
              @click="confirmAddSubtask"
            />
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="cancelAddSubtask"
            />
          </template>
        </v-text-field>
      </div>
    </v-slide-y-transition>
    
    <!-- Details Dialog -->
    <v-dialog v-model="showDetails" max-width="500">
      <v-card>
        <v-card-title>
          Task Details
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDetails = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- Task Text -->
          <v-text-field
            v-model="detailsForm.text"
            label="Task"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          
          <!-- Due Date -->
          <v-text-field
            v-model="detailsForm.dueDate"
            label="Due Date"
            type="date"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
          />
          
          <!-- Priority -->
          <v-select
            v-model="detailsForm.priority"
            label="Priority"
            :items="priorityOptions"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
          />
          
          <!-- Notes -->
          <v-textarea
            v-model="detailsForm.notes"
            label="Notes"
            variant="outlined"
            rows="3"
            auto-grow
            class="mb-3"
          />
          
          <!-- Metadata -->
          <div class="text-caption text-grey">
            <div>Created: {{ formatDate(item.createdAt) }}</div>
            <div v-if="item.completedAt">
              Completed: {{ formatDate(item.completedAt) }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetails = false">Cancel</v-btn>
          <v-btn color="primary" variant="text" @click="saveDetails">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

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

interface Props {
  item: TodoItem
  level: number
  showCompleted: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [item: TodoItem]
  delete: [itemId: string]
  'add-child': [parentId: string, text: string]
}>()

// State
const isExpanded = ref(true)
const isEditing = ref(false)
const editText = ref('')
const editInput = ref<HTMLInputElement>()
const showAddSubtask = ref(false)
const subtaskText = ref('')
const showDetails = ref(false)
const detailsForm = ref({
  text: '',
  dueDate: '',
  priority: undefined as 'low' | 'medium' | 'high' | undefined,
  notes: ''
})

// Priority options
const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' }
]

// Computed
const dueDateColor = computed(() => {
  if (!props.item.dueDate) return 'grey'
  const dueDate = new Date(props.item.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (dueDate < today) return 'error'
  if (dueDate.getTime() === today.getTime()) return 'warning'
  return 'grey'
})

// Methods
const toggleComplete = (value: boolean) => {
  emit('update', {
    ...props.item,
    completed: value,
    completedAt: value ? new Date() : undefined
  })
}

const startEdit = () => {
  if (isEditing.value) return
  isEditing.value = true
  editText.value = props.item.text
  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

const saveEdit = () => {
  if (editText.value.trim() && editText.value !== props.item.text) {
    emit('update', {
      ...props.item,
      text: editText.value.trim()
    })
  }
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  editText.value = ''
}

const addSubtask = () => {
  showAddSubtask.value = true
  isExpanded.value = true
}

const confirmAddSubtask = () => {
  if (subtaskText.value.trim()) {
    emit('add-child', props.item.id, subtaskText.value.trim())
    subtaskText.value = ''
    showAddSubtask.value = false
  }
}

const cancelAddSubtask = () => {
  subtaskText.value = ''
  showAddSubtask.value = false
}

const deleteItem = () => {
  emit('delete', props.item.id)
}

const saveDetails = () => {
  emit('update', {
    ...props.item,
    text: detailsForm.value.text,
    dueDate: detailsForm.value.dueDate ? new Date(detailsForm.value.dueDate) : undefined,
    priority: detailsForm.value.priority,
    notes: detailsForm.value.notes
  })
  showDetails.value = false
}

// Format dates
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString()
}

const formatDueDate = (date: Date): string => {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === today.getTime() + 86400000) return 'Tomorrow'
  if (d < today) return 'Overdue'
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Watch for details dialog
watch(showDetails, (value) => {
  if (value) {
    detailsForm.value = {
      text: props.item.text,
      dueDate: props.item.dueDate ? new Date(props.item.dueDate).toISOString().split('T')[0] : '',
      priority: props.item.priority,
      notes: props.item.notes || ''
    }
  }
})
</script>

<style scoped>
.todo-item-wrapper {
  position: relative;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  min-height: 40px;
  transition: all 0.2s ease;
  border-radius: 4px;
  position: relative;
}

.todo-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.v-theme--dark) .todo-item:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.6;
}

.drag-handle {
  position: absolute;
  left: 4px;
  cursor: move;
}

.expand-btn {
  margin-right: 4px;
}

.expand-spacer {
  width: 28px;
}

.todo-content {
  flex: 1;
  cursor: text;
  padding: 0 8px;
  display: flex;
  align-items: center;
  min-height: 32px;
}

.todo-text {
  flex: 1;
}

.edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #1976d2;
  border-radius: 4px;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  background: white;
}

:deep(.v-theme--dark) .edit-input {
  background: #1e1e1e;
  color: white;
}

.todo-actions {
  display: flex;
  align-items: center;
  transition: opacity 0.2s ease;
}

.add-subtask {
  padding: 8px;
}

:deep(.v-checkbox) {
  flex: 0 0 auto;
}

:deep(.v-input__details) {
  display: none !important;
}
</style>