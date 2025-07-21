<template>
  <div class="container">
    <div class="heading">Wizard Demo</div>
    <FormGenerator
      :fields="steps[currentStep].fields"
      v-model="form"
      @save="onStepSave"
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
    <div class="form-generator__actions wizard-demo__actions">
      <button v-if="currentStep > 0" @click="prevStep" class="btn">Previous</button>
      <button v-if="currentStep < steps.length - 1" @click="nextStep" class="btn">Next</button>
      <button v-else @click="onFinalSave" class="btn">Finish</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import FormGenerator from '../components/form-generator/FormGenerator.vue'
import { FormField } from '../components/form-generator/types'
import VueSelect from 'vue3-select-component'
import AnimatedTitle from '../components/AnimatedTitle.vue'

interface Step {
  fields: FormField[]
}

export default defineComponent({
  name: 'WizardDemo',
  components: { FormGenerator },
  setup() {
    const form = reactive<Record<string, any>>({})
    const currentStep = ref(0)
    const steps: Step[] = [
      {
        fields: [
          { type: 'text', label: 'First Name', id: 'firstName', required: true },
          { type: 'text', label: 'Last Name', id: 'lastName', required: true },
        ],
      },
      {
        fields: [
          { type: 'text', label: 'Email', id: 'email', required: true, attributes: { type: 'email' } },
          { type: 'checkbox', label: 'Subscribe to newsletter', id: 'subscribe' },
        ],
      },
      {
        fields: [
          { type: 'textarea', label: 'Comments', id: 'comments' },
        ],
      },
    ]
    function nextStep() {
      if (currentStep.value < steps.length - 1) currentStep.value++
    }
    function prevStep() {
      if (currentStep.value > 0) currentStep.value--
    }
    function onStepSave() {
      nextStep()
    }
    function onFinalSave() {
      alert('Wizard complete: ' + JSON.stringify(form, null, 2))
    }
    function onCancel() {
      alert('Wizard cancelled')
    }
    return { steps, currentStep, form, nextStep, prevStep, onStepSave, onFinalSave, onCancel }
  },
})
</script>

<style lang="scss" scoped>
@use '@/assets/form-style.scss' as *;
.wizard-demo__actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  justify-content: center;
}
</style> 