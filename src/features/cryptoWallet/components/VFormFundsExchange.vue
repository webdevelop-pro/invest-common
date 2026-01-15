<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { useVFormFundsExchange } from './logic/useVFormFundsExchange';

const emit = defineEmits(['close']);

const props = defineProps({
  data: Object,
  defaultBuySymbol: {
    type: String,
    required: false,
  },
  poolId: {
    type: String,
    required: false,
  },
  profileId: {
    type: [String, Number],
    required: false,
  },
});

const {
  model,
  isDisabledButton,
  saveHandler,
  cancelHandler,
  text,
  errorData,
  exchangeTokensState,
  receiveAmount,
  tokenToFormatted,
  tokensFromFormatted,
  numberFormatter,
  isFieldRequired,
  getErrorText,
  exchangeRate,
  selectedToken,
} = useVFormFundsExchange(() => emit('close'), props.defaultBuySymbol, props.poolId, props.profileId);
</script>

<template>
  <div class="VFormFundsExchange form-wallet-add-transaction">
    <div class="form-wallet-add-transaction__content">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('from')"
            :error-text="getErrorText('from', errorData)"
            data-testid="from-token-group"
            label="You sell:"
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
              :options="tokensFromFormatted"
              @update:model-value="model.from = String($event)"
            >
              <template #item="slotProps">
                <div class="token-option">
                  <VImage 
                    v-if="slotProps.item.icon" 
                    :src="slotProps.item.icon" 
                    :alt="slotProps.item.symbol" 
                    class="token-option__icon"
                  />
                  <div class="token-option__content">
                    {{ slotProps.item.symbol }}
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
              money-format
              @update:model-value="model.amount = numberFormatter($event)"
            />
          </VFormGroup>
          <div class="form-wallet-add-transaction__text is--small">
            Maximum {{ text }}
          </div>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('to')"
            :error-text="getErrorText('to', errorData)"
            data-testid="to-token-group"
            label="You buy:"
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
            >
              <template #item="slotProps">
                <div class="token-option">
                  <VImage 
                    v-if="slotProps.item.icon" 
                    :src="slotProps.item.icon" 
                    :alt="slotProps.item.symbol" 
                    class="token-option__icon"
                  />
                  <div class="token-option__content">
                    {{ slotProps.item.symbol }}
                  </div>
                </div>
              </template>
            </VFormSelect>
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            label="Receive:"
            class="form-wallet-add-transaction__input"
          >
            <VFormInput
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Amount"
              readonly
              :model-value="receiveAmount"
              size="large"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
    </div>
    
    <!-- Exchange Rate Display -->
    <div
      v-if="exchangeRate && model.from"
      class="form-wallet-add-transaction__exchange-rate is--h6__title"
    >
      1 {{ selectedToken?.symbol || 'Token' }} = {{ exchangeRate.toFixed(6) }} USDC
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

  &__exchange-rate {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin: 16px 0;
    padding: 12px 16px;
    background-color: $gray-10;
    border-radius: 2px;
    border: 1px solid $gray-20;
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

  &__symbol {
    font-weight: 600;
    font-size: 14px;
    color: $black;
  }
}
</style>
