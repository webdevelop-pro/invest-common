<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
} from 'UiKit/components/Base/VTable';
import { IInvest } from 'InvestCommon/types/api/invest';
import { computed, PropType } from 'vue';
import { currency } from 'InvestCommon/helpers/currency';
import { InvestTransactionStatuses } from 'InvestCommon/helpers/enums/invest';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvest>,
    required: true,
  },
});

const dateFull = computed(() => {
  let dateInner = props.investment.payment_data.created_at;
  if (props.investment.payment_data.updated_at) dateInner = props.investment.payment_data.updated_at;
  return dateInner;
});
const getTimeFormat = (fullDate: string) => {
  const date = new Date(fullDate);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
const dateFormatted = computed(() => (dateFull.value ? formatToFullDate(new Date(dateFull.value).toISOString()) : ''));
const timeFormatted = computed(() => (dateFull.value ? getTimeFormat(String(dateFull.value)) : ''));
</script>

<template>
  <VTable
    size="small"
    class="VTablePortfolioTransaction v-table-portfolio-transaction"
  >
    <VTableBody>
      <VTableRow>
        <VTableCell>
          <div>
            {{ dateFormatted }}
          </div>
          <div class="v-table-portfolio-transaction__time">
            {{ timeFormatted }}
          </div>
        </VTableCell>
        <VTableCell class="v-table-portfolio-transaction__transaction-id">
          <div class="is--small-2">
            ID {{ investment?.entity_id }}
          </div>
        </VTableCell>
        <VTableCell>
          <div class="v-table-portfolio-transaction__type">
            <VBadge
              size="small"
              class="is--background-purple-light"
            >
              Investment
            </VBadge>
          </div>
        </VTableCell>
        <VTableCell>
          {{ InvestTransactionStatuses[investment.funding_status]?.text }}
        </VTableCell>
        <VTableCell>
          <div class="v-table-portfolio-transaction__amount is--h6__title">
            {{ currency(Number(investment.amount), 0) }}
          </div>
        </VTableCell>
      </VTableRow>
    </VTableBody>
  </VTable>
</template>

<style lang="scss">
.v-table-portfolio-transaction {
  &__amount {
    color: $black;
    text-align: right;
  }

  &__time {
    color: $gray-60;
  }

  &__type {
    display: flex;
  }

  &__transaction-id {
    color: $gray-80;
  }
}
</style>
