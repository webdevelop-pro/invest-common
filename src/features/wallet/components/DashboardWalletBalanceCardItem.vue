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
  secondaryDepositText?: string;
  secondaryDepositValue?: string;
  secondaryWithdrawText?: string;
  secondaryWithdrawValue?: string;
  action: BalanceCardAction;
}

defineProps({
  card: {
    type: Object as PropType<BalanceCardItem>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const isNonZero = (value?: string) => {
  if (!value) return false;
  const numeric = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numeric)) return false;
  return numeric !== 0;
};
</script>

<template>
  <VCardInfo
    v-if="!card.secondaryDepositValue && !card.secondaryWithdrawValue"
    :title="card.title"
    :amount="card.value"
    :unit="card.unit"
    :loading="loading"
    :secondary-text="card.secondaryText"
    :secondary-value="card.secondaryValue"
    :action="card.action"
    :value-props="{ amountClass: 'is--subheading-1', unitClass: 'is--small' }"
  />
  <VCardInfo
    v-else
    :title="card.title"
    :amount="card.value"
    :unit="card.unit"
    :loading="loading"
    :action="card.action"
    :value-props="{ amountClass: 'is--subheading-1', unitClass: 'is--small' }"
  >
    <template #secondary>
      <div class="v-card-info__secondary is--small">
        <span
          v-if="card.secondaryDepositText && card.secondaryDepositValue"
        >
          <span
            class="v-card-info__secondary-value"
            :class="isNonZero(card.secondaryDepositValue) && 'is--positive'"
          >
            {{ card.secondaryDepositValue }}
          </span>
          <span class="v-card-info__secondary-text">
            {{ card.secondaryDepositText }}
          </span>
        </span>
        <span
          v-if="card.secondaryDepositText && card.secondaryDepositValue && card.secondaryWithdrawText && card.secondaryWithdrawValue"
        >
          &nbsp;|&nbsp;
        </span>
        <span
          v-if="card.secondaryWithdrawText && card.secondaryWithdrawValue"
        >
          <span
            class="v-card-info__secondary-value"
            :class="isNonZero(card.secondaryWithdrawValue) && 'is--negative'"
          >
            {{ card.secondaryWithdrawValue }}
          </span>
          <span class="v-card-info__secondary-text">
            {{ card.secondaryWithdrawText }}
          </span>
        </span>
      </div>
    </template>
  </VCardInfo>
</template>

