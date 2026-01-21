<script setup lang="ts">
import { computed, toRefs } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useEarnDepositCard } from './composables/useEarnDepositCard';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';

interface Props {
  loading?: boolean;
  symbol?: string;
  poolId?: string;
  profileId?: string | number;
  coinBalance?: number;
  walletLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  symbol: 'USDC',
  walletLoading: false,
});

const { poolId, profileId, symbol } = toRefs(props);

const emit = defineEmits<{
  (e: 'exchange-click'): void;
}>();

const {
  model,
  isValid,
  isSubmitting,
  submitHandler,
  onMax,
  isFieldRequired,
  getErrorText,
  scrollToError,
  resetFormValidation,
  errorData,
  depositState,
  isMaxDisabled,
  hasApproved,
  isApproving,
  approveToken,
} = useEarnDepositCard({
  scrollId: 'EarnDepositCard',
  poolId,
  profileId,
  symbol: computed(() => props.symbol),
  maxAmount: computed(() => props.coinBalance ?? undefined),
});

const onExchangeClick = () => {
  resetFormValidation();
  emit('exchange-click');
};

// Expose validation state to parent component
defineExpose({
  isValid,
  onValidate: submitHandler,
  scrollToError,
  model,
  isSubmitting,
});
</script>

<template>
  <div class="EarnDepositCard earn-deposit-card is--card">
    <div class="earn-deposit-card__form">
      <VFormGroup
        v-slot="VFormGroupProps"
        :required="isFieldRequired('amount')"
        :error-text="getErrorText('amount', errorData) as string[]"
        label="Supply Amount"
        class="earn-deposit-card__form-group"
        data-testid="deposit-amount-group"
      >
        <div class="earn-deposit-card__input-wrapper">
          <VFormInput
            :model-value="model.amount ? String(model.amount) : undefined"
            :is-error="VFormGroupProps.isFieldError"
            type="number"
            placeholder="0.00"
            size="large"
            money-format
            name="deposit-amount"
            class="earn-deposit-card__input"
            data-testid="deposit-amount"
            @update:model-value="model.amount = numberFormatter($event)"
          />
          <div class="earn-deposit-card__input-actions">
            <VSkeleton
              v-if="loading"
              height="20px"
              width="40px"
            />
            <VButton
              v-else
              variant="link"
              size="small"
              :disabled="isMaxDisabled"
              @click="onMax"
            >
              Max
            </VButton>
            <span class="earn-deposit-card__symbol-badge">
              {{ symbol }}
            </span>
          </div>
        </div>
      </VFormGroup>
      <div class="earn-deposit-card__balance is--small-2">
        Available Balance: 
        <VSkeleton
          v-if="walletLoading"
          height="16px"
          width="50px"
        />
        <span v-else>
          {{ coinBalance || 0 }}
        </span>
      </div>
      <div class="earn-deposit-card__balance is--small">
        Don't have enough balance?
        <a
          href="#"
          class="earn-deposit-card__exchange-button is--link-2"
          @click.prevent="onExchangeClick"
        >
          Exchange
        </a>
      </div>
      <VButton
        v-if="!hasApproved"
        block
        size="large"
        :disabled="loading || walletLoading || isApproving"
        :loading="isApproving"
        class="is--margin-top-8"
        @click="approveToken"
      >
        Approve {{ symbol }}
      </VButton>
      <VButton
        v-else
        block
        size="large"
        :disabled="!isValid || loading || depositState.loading"
        :loading="isSubmitting || depositState.loading"
        data-testid="deposit-button"
        class="is--margin-top-8"
        @click="submitHandler"
      >
        Supply
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.earn-deposit-card {
  display: flex;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 400px;
  flex-shrink: 0;

  @media screen and (max-width: $desktop){
    width: 100%;
  }

  &__balance {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 4px;

    &.is--small-2 {
      margin-top: 8px;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  &__form-group {
    margin-bottom: 0;
  }

  &__input-wrapper {
    position: relative;
  }

  &__input {
    width: 100%;
  }

  &__input-actions {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1;
  }

  &__symbol-badge {
    padding: 4px 8px;
    background-color: $gray-20;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: $black;
  }
}
</style>

