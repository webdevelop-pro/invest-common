<script setup lang="ts">
import { useTemplateRef } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useInvestFundingForm } from './logic/useInvestFundingForm';

const props = defineProps({
  errorData: {
    type: Object,
  },
  schemaBackend: {
    type: Object,
  },
  data: {
    type: Object,
  },
  isLoading: {
    type: Boolean,
  },
  getWalletState: {
    type: Object,
  },
  walletId: {
    type: Number,
  },
  getEvmWalletState: {
    type: Object,
  },
  evmWalletId: {
    type: Number,
  },
  selectedUserProfileData: {
    type: Object,
  },
});

const emit = defineEmits<{
  (e: 'update:componentData', value: undefined): void;
}>();

// Ref to the dynamic component (ACH form)
const dynamicFormRef = useTemplateRef<{ isValid: boolean; onValidate: () => void; scrollToError: (selector: string) => void }>('dynamicFormRef');

const {
  model,
  isValid,
  onValidate,
  scrollToError,
  selectOptions,
  selectErrors,
  isBtnDisabled,
  currentComponent,
  currentProps,
  componentData,
  isFieldRequired,
} = useInvestFundingForm(props, emit, dynamicFormRef);

// Expose validation state to parent component
defineExpose({
  isValid,
  onValidate,
  scrollToError,
  isBtnDisabled,
  componentData,
  model,
});
</script>

<template>
  <div class="FormInvestFunding form-invest-funding">
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('funding_type')"
          :error-text="selectErrors"
          data-testid="funding-type-group"
          label="Funding Method"
        >
          <VFormSelect
            v-model="model.funding_type"
            :is-error="VFormGroupProps.isFieldError"
            item-label="text"
            item-value="value"
            placeholder="Select"
            size="large"
            name="funding-type"
            :loading="(selectOptions?.length === 0) || isLoading"
            :options="selectOptions"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <KeepAlive>
      <component
        :is="currentComponent"
        ref="dynamicFormRef"
        v-bind="currentProps"
        v-model="componentData"
      />
    </KeepAlive>
  </div>
</template>

<style lang="scss">
.form-invest-funding {
  width: 100%;
}
</style>
