<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VLayoutDialogForm from 'InvestCommon/shared/layouts/VLayoutDialogForm.vue';

defineProps<{
  chain?: string;
  asset?: string;
  amount?: number | string;
  destinationAddress?: string;
  chainOptions: { id: string; text: string }[];
  tokenOptions: { id: string; text: string; icon?: string; symbol?: string }[];
  availableText: string;
  networkHelperText: string;
  assetHelperText: string;
  destinationAddressHelperText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isFieldRequired: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getErrorText: (...args: any[]) => any;
  numberFormatter: (v: string | number) => number;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:chain': [value: string];
  'update:asset': [value: string];
  'update:amount': [value: number | undefined];
  'update:destinationAddress': [value: string];
  submit: [];
  cancel: [];
}>();
</script>

<template>
  <VLayoutDialogForm
    class="VFormWithdrawCrypto v-form-withdraw-crypto"
    primary-label="Withdraw"
    :disabled="disabled"
    :loading="loading"
    primary-test-id="withdraw-crypto-submit"
    footer-class="v-form-withdraw-crypto__footer"
    @submit="emit('submit')"
    @cancel="emit('cancel')"
  >
    <FormRow class="v-form-withdraw-crypto__row">
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          label="Network"
          :required="isFieldRequired('chain')"
          :error-text="getErrorText('chain', errorData) ? [getErrorText('chain', errorData)!] : undefined"
          :helper-text="networkHelperText"
          class="v-form-withdraw-crypto__input"
        >
          <VFormSelect
            :is-error="VFormGroupProps.isFieldError"
            :model-value="chain || undefined"
            :options="chainOptions"
            item-label="text"
            item-value="id"
            placeholder="Select"
            dropdown-absolute
            data-testid="withdraw-chain"
            @update:model-value="emit('update:chain', $event as string)"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          label="Asset to Withdraw"
          :required="isFieldRequired('asset')"
          :error-text="getErrorText('asset', errorData) ? [getErrorText('asset', errorData)!] : undefined"
          :helper-text="assetHelperText"
          class="v-form-withdraw-crypto__input"
        >
          <VFormSelect
            :is-error="VFormGroupProps.isFieldError"
            :model-value="asset || undefined"
            :options="tokenOptions"
            item-label="text"
            item-value="id"
            placeholder="Select"
            dropdown-absolute
            data-testid="withdraw-asset"
            @update:model-value="emit('update:asset', $event as string)"
          >
            <template #item="slotProps">
              <div class="token-option">
                <VImage
                  v-if="(slotProps.item as { icon?: string }).icon"
                  :src="(slotProps.item as { icon: string }).icon"
                  :alt="(slotProps.item as { symbol?: string }).symbol ?? ''"
                  class="token-option__icon"
                />
                <div class="token-option__content">
                  {{ (slotProps.item as { symbol?: string }).symbol }}
                </div>
              </div>
            </template>
          </VFormSelect>
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('amount')"
          :error-text="getErrorText('amount', errorData) ? [getErrorText('amount', errorData)!] : undefined"
          data-testid="withdraw-amount-group"
          :helper-text="availableText"
          label="Amount"
          class="v-form-withdraw-crypto__input"
        >
          <VFormInput
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Amount"
            :model-value="amount != null ? String(amount) : undefined"
            name="amount"
            size="large"
            @update:model-value="emit('update:amount', numberFormatter($event))"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow class="v-form-withdraw-crypto__row">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('destination_address')"
          :error-text="getErrorText('destination_address', errorData) ? [getErrorText('destination_address', errorData)!] : undefined"
          label="Recipient Wallet Address"
          :helper-text="destinationAddressHelperText"
          class="v-form-withdraw-crypto__input"
        >
          <VFormInput
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address"
            :model-value="destinationAddress || undefined"
            name="destination_address"
            size="large"
            data-testid="withdraw-address"
            @update:model-value="emit('update:destinationAddress', $event as string)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </VLayoutDialogForm>
</template>

<style lang="scss" scoped>
.v-form-withdraw-crypto {
  &__row {
    margin-top: 0;
  }

  &__input {
    width: 100%;
  }

  &__helper--asset {
    margin-bottom: 16px;
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

.token-option {
  display: flex;
  align-items: center;
  gap: 8px;

  &__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
