import { reactive } from 'vue'
import { FormField } from './types'

export default function useValidation(fields: FormField[], formData: Record<string, any>) {
  const errors = reactive<Record<string, string>>({})

  function validate() {
    let valid = true
    for (const field of fields) {
      if (field.required && !formData[field.id]) {
        errors[field.id] = 'This field is required.'
        valid = false
      } else {
        errors[field.id] = ''
      }
    }
    return valid
  }

  function resetValidation() {
    for (const key in errors) {
      errors[key] = ''
    }
  }

  return { errors, validate, resetValidation }
} 