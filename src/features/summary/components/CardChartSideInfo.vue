<script setup lang="ts">
import { computed } from 'vue';

export interface SideInfoItem {
  label: string;
  amount?: number;
  percent?: number;
  color?: string;
}

const props = defineProps<{
  items: SideInfoItem[];
  showAmount?: boolean;
  showPercent?: boolean;
  amountFormatter?: (v: number) => string;
  percentFormatter?: (v: number) => string;
}>();

const defaultAmountFormatter = (v: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v || 0));
const defaultPercentFormatter = (v: number) => `${Math.round(Number(v || 0))}%`;

const formatAmount = (v?: number) => (props.amountFormatter || defaultAmountFormatter)(Number(v || 0));
const formatPercent = (v?: number) => (props.percentFormatter || defaultPercentFormatter)(Number(v || 0));

const hasAmount = computed(() => props.showAmount !== false);
const hasPercent = computed(() => props.showPercent !== false);
</script>

<template>
  <div class="CardChartSideInfo card-chart-side-info">
    <ul class="card-chart-side-info__list">
      <li
        v-for="item in items"
        :key="item.label"
        class="card-chart-side-info__item"
      >
        <div class="card-chart-side-info__item-row">
          <span
            class="card-chart-side-info__marker"
            :style="{ backgroundColor: item.color || '#E9ECEF' }"
          />
          <span class="is--h6__title">
            {{ item.label }}
          </span>
        </div>
        <div class="card-chart-side-info__item-row is--justify-space-between is--row-2">
          <span
            v-if="hasAmount"
            class="is--small-2"
          >
            {{ formatAmount(item.amount) }}
          </span>
          <span
            v-if="hasPercent"
            class="is--h6__title"
          >
            {{ formatPercent(item.percent) }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss">
.card-chart-side-info {
  display: flex;
  flex-direction: column;
  justify-content: center;

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    display: flex;
    flex-direction: column;
  }

  &__item-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    &.is--row-2 {
      padding-left: 18px;
    }
  }

  &__marker {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: 0 0 10px;
  }
}
</style>


