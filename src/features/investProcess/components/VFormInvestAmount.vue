<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { useInvestAmountForm } from './logic/useInvestAmountForm';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';

const props = defineProps({
  modelValue: {
    type: Object,
  },
  errorData: {
    type: Object,
  },
  data: {
    type: Object,
  },
  backendSchema: {
    type: Object,
  },
  isLoading: {
    type: Boolean,
  },
});

const emit = defineEmits(['update:modelValue']);

const {
  maxInvestment,
  minInvestment,
  model,
  isValid,
  onValidate,
  investmentAmountShow,
  isLeftLessThanMin,
  isFieldRequired,
  getErrorText,
  scrollToError,
  investmentAmount,
  isBtnDisabled,
} = useInvestAmountForm(props, emit);


// Expose validation state to parent component
defineExpose({
  isValid,
  onValidate,
  scrollToError,
  isBtnDisabled,
  model,
  investmentAmount,
});
</script>

<template>
  <div
    class="FormInvestAmount form-invest-amount"
    data-testid="invest-amount-form"
  >
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('number_of_shares')"
          :error-text="getErrorText('number_of_shares', errorData || {})"
          data-testid="shares-amount-group"
          label="Amount of Shares"
        >
          <VFormInput
            :model-value="model.number_of_shares ? String(model.number_of_shares) : undefined"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Amount"
            name="shares-amount"
            size="large"
            :loading="isLoading"
            allow-integer-only
            @update:model-value="model.number_of_shares = numberFormatter($event)"
          />
        </VFormGroup>
        <p
          v-if="isLeftLessThanMin"
          class="form-invest-amount__limit-info"
        >
          Please enter either the maximum number of shares available - {{ maxInvestment }},
          or reduce your order size by {{ minInvestment - maxInvestment + model.number_of_shares }}
        </p>
        <p class="form-invest-amount__info is--small">
          Minimum - {{ minInvestment }} shares,
          Maximum - {{ maxInvestment }} shares
        </p>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          label="Investment Amount"
        >
          <VFormInput
            :model-value="investmentAmountShow"
            placeholder="$"
            name="amount-of-investment"
            readonly
            :loading="isLoading"
            size="large"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.form-invest-amount {
  width: 100%;

  &__limit-info {
    font-size: 12px;
    margin-top: 5px;
    color: $red-dark;
    opacity: 1;
  }

  &__info {
    color: $gray-70;
    margin-top: 4px;
  }
}
</style>

