export interface FormField {
  type: 'text' | 'select' | 'checkbox' | 'textarea'
  label: string
  id: string
  value?: any
  options?: Array<{ label: string; value: any }>
  attributes?: Record<string, any>
  required?: boolean
  // другие необходимые параметры
} 