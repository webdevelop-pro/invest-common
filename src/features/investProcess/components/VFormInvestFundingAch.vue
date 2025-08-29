<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import { useInvestFundingAch } from './logic/useInvestFundingAch';

const props = defineProps({
  modelValue: {
    type: Object,
  },
  validate: {
    type: Boolean,
    default: false
  },
  errorData: {
    type: Object,
  },
  paymentData: {
    type: Object,
  }
});

const emit = defineEmits(['update:modelValue']);

const { 
  model, 
  validation, 
  schema, 
  ACCOUNT_TYPES,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  scrollToError
} = useInvestFundingAch(props, emit);

// Expose validation state to parent component
defineExpose({
  isValid,
  onValidate,
  scrollToError
});
</script>

<template>
  <div
    class="FormInvestFundingAch form-invest-funding-ach"
    data-testid="funding-ach"
  >
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schema"
          :error-text="getErrorText('accountHolderName', errorData)"
          path="accountHolderName"
          label="Account Holder Name"
          :required="isFieldRequired('accountHolderName')"
        >
          <VFormInput
            :model-value="model.accountHolderName"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Account Holder Name"
            name="holder-name"
            size="large"
            @update:model-value="model.accountHolderName = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schema"
          :error-text="getErrorText('accountType', errorData)"
          path="accountType"
          label="Account Type"
          :required="isFieldRequired('accountType')"
        >
          <VFormSelect
            v-model="model.accountType"
            :is-error="VFormGroupProps.isFieldError"
            item-label="text"
            item-value="value"
            name="account-type"
            placeholder="Account Type"
            size="large"
            :loading="ACCOUNT_TYPES.length === 0"
            :options="ACCOUNT_TYPES"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schema"
          :error-text="getErrorText('accountNumber', errorData)"
          path="accountNumber"
          label="Account Number"
          :required="isFieldRequired('accountNumber')"
        >
          <VFormInput
            :model-value="model.accountNumber"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Account Number"
            name="account-number"
            size="large"
            allow-integer-only
            @update:model-value="model.accountNumber = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schema"
          :error-text="getErrorText('routingNumber', errorData)"
          path="routingNumber"
          label="Routing Number"
          :required="isFieldRequired('routingNumber')"
        >
          <VFormInput
            :model-value="model.routingNumber"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Routing Number"
            name="routing-number"
            size="large"
            allow-integer-only
            @update:model-value="model.routingNumber = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schema"
          :error-text="getErrorText('authorizeDebit', errorData)"
          path="authorizeDebit"
          class="is--margin-top-15"
          :required="isFieldRequired('authorizeDebit')"
        >
          <VFormCheckbox
            v-model="model.authorizeDebit"
            :is-error="VFormGroupProps.isFieldError"
            has-asterisk
          >
            I authorize the platform to debit my bank account for this investment.
          </VFormCheckbox>
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>
