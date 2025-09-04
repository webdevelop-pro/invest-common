<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { useVFormFundsWithdraw } from './logic/useVFormFundsWithdraw';

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
  withdrawFundsState,
  tokenFormatted,
  numberFormatter,
  isFieldRequired,
  getErrorText,
} = useVFormFundsWithdraw(() => emit('close'));
</script>

<template>
  <div class="VFormFundsWithdraw form-wallet-add-transaction">
    <div class="form-wallet-add-transaction__content">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('token')"
            :error-text="getErrorText('token', errorData)"
            data-testid="funding-source-group"
            label="Funding Source"
            class="form-wallet-add-transaction__input"
          >
            <VFormSelect
              :model-value="model.token || undefined"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Select token"
              name="token"
              item-label="text"
              item-value="id"
              dropdown-absolute
              :options="tokenFormatted"
              @update:model-value="model.token = String($event)"
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
            :required="isFieldRequired('to')"
            :error-text="getErrorText('to', errorData)"
            label="Wallet address where to send"
            class="form-wallet-add-transaction__input"
          >
            <VFormInput
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Address"
              :model-value="model.to ? String(model.to) : undefined"
              name="to"
              size="large"
              @update:model-value="model.to = $event"
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
        :loading="withdrawFundsState.loading"
        data-testid="button"
        @click="saveHandler"
      >
        Withdraw
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
