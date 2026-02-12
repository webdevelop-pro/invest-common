<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VLayoutDialogForm from 'InvestCommon/shared/layouts/VLayoutDialogForm.vue';
import { useVFormExchange } from './logic/useVFormExchange';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

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

const { isTablet } = useBreakpoints();

const {
  model,
  isDisabledButton,
  saveHandler,
  cancelHandler,
  maxExchange,
  errorData,
  exchangeTokensState,
  receiveAmount,
  tokenToFormatted,
  tokensFromFormatted,
  numberFormatter,
  exchangeRateLabel,
  isFieldRequired,
  getErrorText,
} = useVFormExchange(() => emit('close'), props.defaultBuySymbol, props.poolId, props.profileId);
</script>

<template>
  <VLayoutDialogForm
    class="VFormExchange v-form-exchange"
    primary-label="Exchange"
    :disabled="isDisabledButton"
    :loading="exchangeTokensState.loading"
    primary-test-id="button"
    footer-class="v-form-exchange__footer"
    @submit="saveHandler"
    @cancel="cancelHandler"
  >
    <div class="v-form-exchange__content">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('from')"
            :error-text="getErrorText('from', errorData)"
            data-testid="from-token-group"
            label="YOU SELL"
            class="v-form-exchange__input"
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
            :error-text="getErrorText('amount', errorData)"
            data-testid="amount-group"
            :helper-text="`Maximum available: ${maxExchange}`"
            :label="isTablet ? '' : '&nbsp;'"
            class="v-form-exchange__input"
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
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('to')"
            :error-text="getErrorText('to', errorData)"
            data-testid="to-token-group"
            label="YOU BUY"
            class="v-form-exchange__input"
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
            helper-text="Amount you receive"
            :label="isTablet ? '' : '&nbsp;'"
            class="v-form-exchange__input"
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
    <VAlert
      v-if="exchangeRateLabel"
      variant="info"
      class="v-form-exchange__rate"
    >
      <template #description>
        {{ exchangeRateLabel }}
      </template>
    </VAlert>
  </VLayoutDialogForm>
</template>

<style lang="scss" scoped>
.v-form-exchange {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: 0 auto;
  width: 700px;

  &__content {
    margin-bottom: 0;
  }

  &__input {
    width: 100%;
  }

  &__text {
    color: $gray-70;
    margin-top: 4px;
  }

  &__rate {
    margin: 16px 0;
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
}
</style>
