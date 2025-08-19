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

const { model, validation, schema, ACCOUNT_TYPES } = useInvestFundingAch(props, emit);
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
          :error-text="errorData?.accountHolderName"
          path="accountHolderName"
          label="Account Holder Name"
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
          :error-text="errorData?.accountType"
          path="accountType"
          label="Account Type"
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
          :error-text="errorData?.accountNumber"
          path="accountNumber"
          label="Account Number"
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
          :error-text="errorData?.routingNumber"
          path="routingNumber"
          label="Routing Number"
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
          :error-text="errorData?.authorizeDebit"
          path="authorizeDebit"
          class="is--margin-top-15"
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
