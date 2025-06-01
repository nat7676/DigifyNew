<template>
  <v-textarea
    v-model="internalValue"
    :label="label"
    :placeholder="placeholder"
    :rows="rows"
    :auto-grow="autoGrow"
    :readonly="readonly"
    :disabled="disabled"
    :variant="variant"
    :density="density"
    :hide-details="hideDetails"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  autoGrow?: boolean
  readonly?: boolean
  disabled?: boolean
  variant?: 'outlined' | 'filled' | 'solo' | 'underlined' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  autoGrow: true,
  readonly: false,
  disabled: false,
  variant: 'outlined',
  density: 'default',
  hideDetails: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

const handleUpdate = (value: string) => {
  emit('update:modelValue', value)
}
</script>