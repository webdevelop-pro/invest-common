<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { useVFormFundsExchange } from './logic/useVFormFundsExchange';

const emit = defineEmits(['close']);

defineProps({
  data: Object,
});

const {
  model,
  isDisabledButton,
  saveHandler,
  cancelHandler,
  text,
  errorData,
  exchangeTokensState,
  tokenFormatted,
  tokenToFormatted,
  numberFormatter,
  isFieldRequired,
  getErrorText,
} = useVFormFundsExchange(() => emit('close'));
</script>

<template>
  <div class="VFormFundsExchange form-wallet-add-transaction">
    <div class="form-wallet-add-transaction__content">
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('from')"
            :error-text="getErrorText('from', errorData)"
            data-testid="from-token-group"
            label="From Token"
            class="form-wallet-add-transaction__input"
          >
            <VFormSelect
              :model-value="model.from || undefined"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Select source token"
              name="from"
              item-label="text"
              item-value="id"
              dropdown-absolute
              :options="tokenFormatted"
              @update:model-value="model.from = String($event)"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('to')"
            :error-text="getErrorText('to', errorData)"
            data-testid="to-token-group"
            label="To Token"
            class="form-wallet-add-transaction__input"
          >
            <VFormSelect
              :model-value="model.to || undefined"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Select destination token"
              name="to"
              item-label="text"
              item-value="id"
              dropdown-absolute
              readonly
              :options="tokenToFormatted"
              @update:model-value="model.to = String($event)"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
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
              placeholder="Amount"
              :model-value="model.amount ? String(model.amount) : undefined"
              name="amount"
              size="large"
              @update:model-value="model.amount = numberFormatter($event)"
            />
          </VFormGroup>
          <div class="form-wallet-add-transaction__text is--small">
            Maximum {{ text }}
          </div>
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
        :loading="exchangeTokensState.loading"
        data-testid="button"
        @click="saveHandler"
      >
        Exchange
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
