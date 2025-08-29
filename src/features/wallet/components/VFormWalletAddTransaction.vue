<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import { PropType, computed } from 'vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useVFormWalletAddTransaction } from './logic/useVFormWalletAddTransaction';

const emit = defineEmits(['close']);

const props = defineProps({
  transactionType: {
    type: String as PropType<WalletAddTransactionTypes>,
    required: true,
  },
});

const transactionTypeComputed = computed(() => props.transactionType);

const {
  model,
  isDisabledButton,
  saveHandler,
  cancelHandler,
  titile,
  text,
  errorData,
  addTransactionState,
  fundingSourceFormatted,
  numberFormatter,
  isFieldRequired,
  getErrorText,
} = useVFormWalletAddTransaction(transactionTypeComputed, () => emit('close'));
</script>

<template>
  <div class="VFormWalletAddTransaction form-wallet-add-transaction">
    <div class="form-wallet-add-transaction__content">
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('amount')"
            :error-text="getErrorText('amount', errorData)"
            data-testid="amount-group"
            label="Amount"
            class="form-wallet-add-transaction__input"
          >
            <VFormInput
              :is-error="VFormGroupProps.isFieldError"
              placeholder="$"
              :model-value="model.amount ? String(model.amount) : undefined"
              name="amount"
              money-format
              data-testid="amount"
              @update:model-value="model.amount = numberFormatter($event)"
            />
          </VFormGroup>
          <div class="form-wallet-add-transaction__text is--small">
            Maximum {{ text }}
          </div>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('funding_source_id')"
            :error-text="getErrorText('funding_source_id', errorData)"
            data-testid="funding-source-group"
            label="Funding Source"
            class="form-wallet-add-transaction__input"
          >
            <VFormSelect
              :model-value="model.funding_source_id ? String(model.funding_source_id) : undefined"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Select funding source"
              name="funding_source_id"
              item-label="text"
              item-value="id"
              dropdown-absolute
              :options="fundingSourceFormatted"
              data-testid="funding-source"
              @update:model-value="model.funding_source_id = numberFormatter($event)"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-wallet-add-transaction__footer">
      <VButton
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        :disabled="isDisabledButton"
        :loading="addTransactionState.loading"
        data-testid="button"
        @click="saveHandler"
      >
        {{ titile }}
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.form-wallet-add-transaction {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: 0 auto;
  width: 700px;

  &__header {
    margin-top: 33px;
    margin-bottom: 20px;
  }

  &__text {
    color: $gray-70;
    margin-top: 4px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
    margin-bottom: 4px;
  }
}
</style>
