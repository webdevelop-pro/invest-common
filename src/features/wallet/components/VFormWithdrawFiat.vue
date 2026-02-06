<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';

defineProps<{
  amount?: number;
  fundingSourceId?: number | string;
  fundingSourceOptions: { id: number; text: string }[];
  maxFiatAmountFormatted: string;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:amount': [value: number | undefined];
  'update:fundingSourceId': [value: number | string | undefined];
  submit: [];
  cancel: [];
}>();
</script>

<template>
  <div class="VFormWithdrawFiat v-form-withdraw-fiat">
    <FormRow class="v-form-withdraw-fiat__row">
      <FormCol>
        <VFormGroup
          label="Amount"
          required
          class="v-form-withdraw-fiat__input"
        >
          <VFormInput
            placeholder="$"
            :model-value="amount != null ? String(amount) : undefined"
            money-format
            data-testid="withdraw-fiat-amount"
            @update:model-value="emit('update:amount', numberFormatter($event))"
          />
        </VFormGroup>
        <div class="v-form-withdraw-fiat__hint">
          Maximum transaction is {{ maxFiatAmountFormatted }}
        </div>
      </FormCol>
    </FormRow>
    <FormRow class="v-form-withdraw-fiat__row">
      <FormCol>
        <VFormGroup
          label="Funding Source"
          required
          class="v-form-withdraw-fiat__input"
        >
          <VFormSelect
            :model-value="fundingSourceId != null ? String(fundingSourceId) : undefined"
            :options="fundingSourceOptions"
            item-label="text"
            item-value="id"
            placeholder="Select"
            dropdown-absolute
            data-testid="withdraw-funding-source"
            @update:model-value="emit('update:fundingSourceId', numberFormatter($event as string | number))"
          />
        </VFormGroup>
        <div class="v-form-withdraw-fiat__helper">
          Select your bank account you want to withdraw the funds to.
        </div>
      </FormCol>
    </FormRow>
    <div class="v-form-withdraw-fiat__footer">
      <VButton
        variant="outlined"
        @click="emit('cancel')"
      >
        Cancel
      </VButton>
      <VButton
        :disabled="disabled"
        :loading="loading"
        data-testid="withdraw-fiat-submit"
        @click="emit('submit')"
      >
        Withdraw
      </VButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-form-withdraw-fiat {
  &__row {
    margin-top: 0;
  }

  &__input {
    width: 100%;
  }

  &__hint,
  &__helper {
    color: $gray-70;
    font-size: 14px;
    margin-top: 4px;
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
