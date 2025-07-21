<template>
  <div class="container">
    <div class="heading">Dynamic Demo</div>
    <button @click="addField" class="btn" style="margin-bottom: 16px;">Add Field</button>
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

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import FormGenerator from '../components/form-generator/FormGenerator.vue'
import { FormField } from '../components/form-generator/types'
import VueSelect from 'vue3-select-component'
import AnimatedTitle from '../components/AnimatedTitle.vue'

let fieldCount = 1

export default defineComponent({
  name: 'DynamicDemo',
  components: { FormGenerator },
  setup() {
    const form = reactive<Record<string, any>>({})
    const fields = ref<FormField[]>([
      { type: 'text', label: 'Field 1', id: 'field1', required: true },
    ])
    function addField() {
      fieldCount++
      fields.value.push({
        type: 'text',
        label: `Field ${fieldCount}`,
        id: `field${fieldCount}`,
        required: false,
      })
    }
    function onSave(data: any) {
      alert('Saved: ' + JSON.stringify(data, null, 2))
    }
    function onCancel() {
      alert('Cancelled')
    }
    return { fields, form, addField, onSave, onCancel }
  },
})
</script>

<style lang="scss" scoped>
@use '@/assets/form-style.scss' as *;
</style> 