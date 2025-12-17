<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VProfileSelectList from 'InvestCommon/features/profiles/VProfileSelectList.vue';
import { useInvesOwnershipForm } from './logic/useInvestOwnershipForm';

const props = defineProps({
  modelValue: {
    type: Object,
  },
  errorData: {
    type: Object,
  },
  data: {
    type: Object,
    required: true,
  },
  schemaBackend: {
    type: Object,
  },
  isLoading: {
    type: Boolean,
  },
});

const emit = defineEmits(['update:modelValue']);

const {
  model,
  isValid,
  isBtnDisabled,
  onValidate,
  isDirty,
} = useInvesOwnershipForm(props, emit);

// Expose validation state to parent component
defineExpose({
  isValid,
  onValidate,
  // button depends only on ownership validity here
  isBtnDisabled,
  model,
  isDirty,
});
</script>

<template>
  <div class="VFormInvestOwnership invest-form-ownership-wrap">
    <FormRow>
      <FormCol>
        <VProfileSelectList
          :default-value="model.profile_id ? String(model.profile_id) : undefined"
          label="Investment Profile"
          :loading="isLoading"
          hide-disabled
          @select="(value: string) => { model.profile_id = Number(value); }"
        />
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.invest-form-ownership {
  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
