<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';

defineProps<{
  token?: string;
  amount?: number | string;
  to?: string;
  tokenOptions: { id: string; text: string; icon?: string; symbol?: string }[];
  availableText: string;
  errorData?: unknown;
  isFieldRequired: (field: string) => boolean;
  getErrorText: (field: string, errorData: unknown) => string | undefined;
  numberFormatter: (v: string | number) => number;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:token': [value: string];
  'update:amount': [value: number | undefined];
  'update:to': [value: string];
  submit: [];
  cancel: [];
}>();
</script>

<template>
  <div class="VFormWithdrawCrypto v-form-withdraw-crypto">
    <VFormGroup
      label="Asset to Withdraw"
      required
      class="v-form-withdraw-crypto__input"
    >
      <VFormSelect
        :model-value="token || undefined"
        :options="tokenOptions"
        item-label="text"
        item-value="id"
        placeholder="Select"
        dropdown-absolute
        data-testid="withdraw-asset"
        @update:model-value="emit('update:token', $event as string)"
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
    <div class="v-form-withdraw-crypto__helper v-form-withdraw-crypto__helper--asset">
      Select the specific asset you wish to transfer out.
    </div>

    <FormRow class="v-form-withdraw-crypto__row">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('amount')"
          :error-text="getErrorText('amount', errorData) ? [getErrorText('amount', errorData)!] : undefined"
          data-testid="withdraw-amount-group"
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
          <div class="v-form-withdraw-crypto__hint">
            Available: {{ availableText }} (Max)
          </div>
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow class="v-form-withdraw-crypto__row">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('to')"
          :error-text="getErrorText('to', errorData) ? [getErrorText('to', errorData)!] : undefined"
          label="Recipient Wallet Address"
          class="v-form-withdraw-crypto__input"
        >
          <VFormInput
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address"
            :model-value="to || undefined"
            name="to"
            size="large"
            data-testid="withdraw-address"
            @update:model-value="emit('update:to', $event as string)"
          />
          <p class="v-form-withdraw-crypto__warning">
            Send only to an Ethereum (ERC20) address. Transfers to other networks will result in permanent loss.
          </p>
        </VFormGroup>
      </FormCol>
    </FormRow>

    <div class="v-form-withdraw-crypto__footer">
      <VButton
        variant="outlined"
        @click="emit('cancel')"
      >
        Cancel
      </VButton>
      <VButton
        :disabled="disabled"
        :loading="loading"
        data-testid="withdraw-crypto-submit"
        @click="emit('submit')"
      >
        Withdraw
      </VButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-form-withdraw-crypto {
  &__row {
    margin-top: 0;
  }

  &__input {
    width: 100%;
  }

  &__helper,
  &__hint {
    color: $gray-70;
    font-size: 14px;
    margin-top: 4px;
  }

  &__helper--asset {
    margin-bottom: 16px;
  }

  &__warning {
    margin-top: 8px;
    font-size: 14px;
    color: $gray-70;
    line-height: 1.4;
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
