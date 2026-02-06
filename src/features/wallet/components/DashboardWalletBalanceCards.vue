<script setup lang="ts">
import { PropType } from 'vue';
import { VCardInfo } from 'UiKit/components/Base/VCard';

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
  action: BalanceCardAction;
}

defineProps({
  cards: {
    type: Array as PropType<BalanceCardItem[]>,
    required: true,
  },
});
</script>

<template>
  <section class="DashboardWalletBalanceCards dashboard-wallet-balance-cards">
    <VCardInfo
      v-for="card in cards"
      :key="card.id"
      :title="card.title"
      :amount="card.value"
      :unit="card.unit"
      :secondary-text="card.secondaryText"
      :secondary-value="card.secondaryValue"
      :action="card.action"
      :value-props="{ amountClass: 'is--subheading-1', unitClass: 'is--small' }"
    />
  </section>
</template>

<style lang="scss">
.dashboard-wallet-balance-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  padding: 20px;
  background: $primary-light;
}
</style>
