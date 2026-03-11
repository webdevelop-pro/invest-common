<script setup lang="ts">
import { PropType, defineAsyncComponent } from 'vue';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import DashboardWalletBalanceCardItem from './DashboardWalletBalanceCardItem.vue';

const VSliderCards = defineAsyncComponent(
  () => import('UiKit/components/VSlider/VSliderCards.vue'),
);

export interface BalanceCardAction {
  label: string;
  href: string;
  iconPre?: string;
  iconPost?: string;
  iconPostClass?: string | string[] | Record<string, unknown>;
}

export interface BalanceCardItem {
  id: string;
  title: string;
  value: string;
  unit: string;
  secondaryText?: string;
  secondaryValue?: string;
  secondaryDepositText?: string;
  secondaryDepositValue?: string;
  secondaryWithdrawText?: string;
  secondaryWithdrawValue?: string;
  action: BalanceCardAction;
}

defineProps({
  cards: {
    type: Array as PropType<BalanceCardItem[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const { isTablet } = useBreakpoints();
const mobileSliderOptions = {
  // Balance cards are static after render; disable embla observers to reduce relayout churn.
  watchResize: false,
  watchSlides: false,
};
</script>

<template>
  <section class="DashboardWalletBalanceCards dashboard-wallet-balance-cards">
    <div
      v-if="!isTablet"
      class="dashboard-wallet-balance-cards__grid"
    >
      <DashboardWalletBalanceCardItem
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :loading="loading"
      />
    </div>
    <div
      v-else
      class="dashboard-wallet-balance-cards__slider"
    >
      <VSliderCards
        :data="cards"
        :options="mobileSliderOptions"
      >
        <template #default="{ slide }">
          <DashboardWalletBalanceCardItem
            :card="slide as BalanceCardItem"
            :loading="loading"
            class="dashboard-wallet-balance-cards__slider-item"
          />
        </template>
      </VSliderCards>
    </div>
  </section>
</template>

<style lang="scss">
.dashboard-wallet-balance-cards {
  padding: 20px;
  background: $primary-light;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  &__grid > * {
    flex: 1 1 200px;
    min-width: 0;
  }

  &__slider {
    margin-top: -10px;
  }

  &__slider-item {
    @media screen and (width < $tablet) {
      height: 100%;
    }
  }
}
</style>
