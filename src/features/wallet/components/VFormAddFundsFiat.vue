<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import VLayoutDialogForm from 'InvestCommon/shared/layouts/VLayoutDialogForm.vue';

defineProps<{
  amount?: number;
  fundingSourceId?: number | string;
  fundingSourceOptions: { id: string; text: string }[];
  maxFiatAmountFormatted: string;
  loading?: boolean;
  disabled?: boolean;
  errorData?: unknown;
  isFieldRequired: (field: string) => boolean;
  getErrorText: (...args: unknown[]) => unknown;
}>();

const emit = defineEmits<{
  'update:amount': [value: number];
  'update:fundingSourceId': [value: number | string];
  submit: [];
  cancel: [];
}>();
</script>

<template>
  <VLayoutDialogForm
    class="VFormAddFundsFiat v-form-add-funds-fiat"
    primary-label="Add Funds"
    :disabled="disabled"
    :loading="loading"
    primary-test-id="add-funds-submit"
    footer-class="v-form-add-funds-fiat__footer"
    @submit="emit('submit')"
    @cancel="emit('cancel')"
  >
    <FormRow class="v-form-add-funds-fiat__row">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          label="Amount"
          :required="isFieldRequired('amount')"
          :error-text="getErrorText('amount', errorData) ? [getErrorText('amount', errorData)!] : undefined"
          :helper-text="`Maximum transaction is ${maxFiatAmountFormatted}`"
          class="v-form-add-funds-fiat__input"
        >
          <VFormInput
            :is-error="VFormGroupProps.isFieldError"
            placeholder="$"
            :model-value="amount != null ? String(amount) : undefined"
            money-format
            size="large"
            data-testid="add-funds-amount"
            @update:model-value="emit('update:amount', numberFormatter($event))"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow class="v-form-add-funds-fiat__row">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          label="Funding Source"
          :required="isFieldRequired('funding_source_id')"
          :error-text="getErrorText('funding_source_id', errorData) ? [getErrorText('funding_source_id', errorData)!] : undefined"
          helper-text="Select your bank account you want to add the funds from."
          class="v-form-add-funds-fiat__input"
        >
          <VFormSelect
            :is-error="VFormGroupProps.isFieldError"
            :model-value="fundingSourceId != null ? String(fundingSourceId) : undefined"
            :options="fundingSourceOptions"
            item-label="text"
            item-value="id"
            placeholder="Select"
            dropdown-absolute
            data-testid="add-funds-funding-source"
            @update:model-value="emit('update:fundingSourceId', numberFormatter($event as string | number))"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </VLayoutDialogForm>
</template>

<style lang="scss" scoped>
.v-form-add-funds-fiat {
  &__row {
    margin-top: 0;
  }

  &__input {
    width: 100%;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    margin-bottom: 4px;
  }
}
</style>
