<template>
  <form class="form" @submit.prevent="onSave">
    <template v-if="$slots.default">
      <slot :fields="fields" :formData="formData" :errors="errors" />
    </template>
    <template v-else>
      <div
        v-for="field in fields"
        :key="field.id"
        :class="['form-generator__field', `form-generator__field--${field.type}`]"
      >
        <label :for="field.id" class="form-generator__label">{{ field.label }}</label>
        <template v-if="$slots[field.type]">
          <slot :name="field.type" :field="field" :value="formData[field.id]" :update="(val: any) => updateField(field.id, val)" />
        </template>
        <template v-else>
          <component :is="getFieldComponent(field)"
            v-bind="field.attributes"
            v-model="formData[field.id]"
            :id="field.id"
            :name="field.id"
            :autocomplete="field.attributes?.autocomplete || 'off'"
            class="input"
            :options="field.options"
          />
        </template>
        <div v-if="errors[field.id]" class="form-generator__error">{{ errors[field.id] }}</div>
      </div>
      <div class="form-generator__actions">
        <button type="submit" class="btn">Save</button>
        <button type="button" class="btn" @click="onCancel">Cancel</button>
      </div>
    </template>
  </form>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, toRefs, watch } from 'vue'
import { FormField } from './types'
import useValidation from './useValidation'

export default defineComponent({
  name: 'FormGenerator',
  props: {
    fields: {
      type: Array as PropType<FormField[]>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    validateOnMount: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'save', 'cancel'],
  setup(props, { emit }) {
    const formData = reactive({ ...props.modelValue })
    const { errors, validate, resetValidation } = useValidation(props.fields, formData)

    watch(
      () => props.modelValue,
      (val) => {
        Object.assign(formData, val)
      }
    )

    function updateField(id: string, value: any) {
      formData[id] = value
      emit('update:modelValue', { ...formData })
    }

    function onSave() {
      if (validate()) {
        emit('save', { ...formData })
      }
    }
    function onCancel() {
      resetValidation()
      emit('cancel')
    }
    function getFieldComponent(field: FormField) {
      switch (field.type) {
        case 'text':
          return 'input'
        case 'select':
          return 'select'
        case 'checkbox':
          return 'input'
        case 'textarea':
          return 'textarea'
        default:
          return 'input'
      }
    }
    return {
      ...toRefs(props),
      formData,
      errors,
      updateField,
      onSave,
      onCancel,
      getFieldComponent,
    }
  },
})
</script>

<style lang="scss">
.form-generator__field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 20px;
}
.form-generator__label {
  font-size: 1.08rem;
  font-weight: 600;
  color: #185ee0;
  margin-bottom: 7px;
  letter-spacing: 0.01em;
  line-height: 1.2;
}
.form-generator__error {
  color: #d32f2f;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  width: 100%;
  text-align: left;
}
.form-generator__actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  justify-content: center;
}
</style> 