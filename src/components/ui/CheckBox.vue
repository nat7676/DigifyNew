<template>
  <v-checkbox
    v-model="internalValue"
    :label="label"
    :disabled="disabled"
    :readonly="readonly"
    :color="color"
    :density="density"
    :hide-details="hideDetails"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
  readonly?: boolean
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  color: 'primary',
  density: 'default',
  hideDetails: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

const handleUpdate = (value: boolean) => {
  emit('update:modelValue', value)
}
</script>