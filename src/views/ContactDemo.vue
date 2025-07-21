<template>
  <div class="container">
    <div class="heading">Contact Demo</div>
    <FormGenerator
      :fields="fields"
      v-model="form"
      @save="onSave"
      @cancel="onCancel"
      class="form"
    >
      <template #select="{ field }">
        <VueSelect
          v-model="form[field.id]"
          :options="field.options"
          :placeholder="field.label"
          style="width: 100%;"
        />
      </template>
    </FormGenerator>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import FormGenerator from '../components/form-generator/FormGenerator.vue'
import { FormField } from '../components/form-generator/types'
import VueSelect from 'vue3-select-component'
import AnimatedTitle from '../components/AnimatedTitle.vue'

const form = reactive<Record<string, any>>({})
const fields: FormField[] = [
  { type: 'text', label: 'Name', id: 'name', required: true },
  { type: 'text', label: 'Email', id: 'email', required: true, attributes: { type: 'email' } },
  { type: 'select', label: 'Topic', id: 'topic', options: [
    { label: 'Support', value: 'support' },
    { label: 'Sales', value: 'sales' },
    { label: 'Other', value: 'other' },
  ], required: true },
  { type: 'textarea', label: 'Message', id: 'message', required: true },
]
function onSave(data: any) {
  alert('Saved: ' + JSON.stringify(data, null, 2))
}
function onCancel() {
  alert('Cancelled')
}
</script>

<style lang="scss" scoped>
@use '@/assets/form-style.scss' as *;
</style> 