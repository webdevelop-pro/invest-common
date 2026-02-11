<script setup lang="ts">
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTextCurrencyWithUnit from 'UiKit/components/VText/VTextCurrencyWithUnit.vue';
import { VMoreActions } from 'UiKit/components/Base/VMoreActions';
import { useDashboardWalletHeader, type DashboardWalletHeaderProps, type PrimaryActionButton } from './logic/useDashboardWalletHeader';

const props = defineProps({
  amount: {
    type: [String, Number],
    required: true,
  },
  coin: {
    type: String,
    required: false,
    default: '',
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  buttons: {
    type: Array as PropType<PrimaryActionButton[]>,
    required: true,
  },
  moreButtons: {
    type: Array as PropType<PrimaryActionButton[]>,
    required: false,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'click', id: string | number, transactionType?: unknown): void;
}>();
  
const {
  visibleButtons,
  moreActionsItems,
  handleClick,
  handleMoreSelect,
} = useDashboardWalletHeader(props as DashboardWalletHeaderProps, (event, id, transactionType) => {
  if (event === 'click') {
    emit('click', id, transactionType);
  }
});
</script>

<template>
  <section class="DashboardWalletHeader dashboard-wallet-header">
    <div class="dashboard-wallet-header__total">
      <div class="dashboard-wallet-header__total-label is--h6__title">
        Total Balance:
      </div>
      <VTextCurrencyWithUnit
        class="dashboard-wallet-header__total-value"
        :amount="amount"
        :unit="coin"
        :loading="loading"
        amount-class="is--h1__title"
      />
      <div class="dashboard-wallet-header__total-subtitle is--small">
        Fiat, Crypto, and RWA holdings in one wallet.
      </div>
    </div>

    <div class="dashboard-wallet-header__actions">
      <VButton
        v-for="button in visibleButtons"
        :key="button.id"
        size="small"
        :variant="button.variant as any"
        :disabled="button.disabled"
        :loading="button.loading"
        class="dashboard-wallet-header__action-button"
        @click="handleClick(button)"
      >
        <component
          :is="button.icon"
          v-if="button.icon"
          alt="button icon"
          class="dashboard-wallet-header__action-icon"
        />
        {{ button.label }}
      </VButton>

      <VMoreActions
        :items="moreActionsItems"
        align="end"
        @select="handleMoreSelect"
      />
    </div>
  </section>
</template>

<style lang="scss">
.dashboard-wallet-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;

  @media screen and (width < $tablet) {
    flex-direction: column;
    align-items: flex-start;
  }

  &__total-label {
    color: $gray-70;
  }

  &__total-value {
    color: $black;
  }

  &__total-subtitle {
    color: $gray-80;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  &__action-icon {
    width: 16px;
  }
}
</style>

