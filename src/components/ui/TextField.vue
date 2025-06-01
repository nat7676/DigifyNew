<template>
  <v-text-field
    v-model="internalValue"
    :label="label"
    :type="type"
    :placeholder="placeholder"
    :readonly="readonly"
    :disabled="disabled"
    :variant="variant"
    :density="density"
    :hide-details="hideDetails"
    :min="min"
    :max="max"
    :step="step"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
  variant?: 'outlined' | 'filled' | 'solo' | 'underlined' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  readonly: false,
  disabled: false,
  variant: 'outlined',
  density: 'default',
  hideDetails: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

const handleUpdate = (value: string | number) => {
  if (props.type === 'number' && typeof value === 'string') {
    const numValue = parseFloat(value)
    emit('update:modelValue', isNaN(numValue) ? 0 : numValue)
  } else {
    emit('update:modelValue', value)
  }
}
</script>