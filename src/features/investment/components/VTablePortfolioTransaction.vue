<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
} from 'UiKit/components/Base/VTable';
import { computed, PropType } from 'vue';
import { InvestTransactionStatuses } from 'InvestCommon/helpers/enums/invest';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';

const props = defineProps({
  investment: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
});
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
            {{ investment.payment_data.updated_at ? investment.paymentDataUpdatedAtFormatted : investment.paymentDataCreatedAtFormatted }}
          </div>
          <div class="v-table-portfolio-transaction__time">
            {{ investment.payment_data.updated_at ? investment.paymentDataUpdatedAtTime : investment.paymentDataCreatedAtTime }}
          </div>
        </VTableCell>
        <VTableCell
          v-if="investment?.payment_data?.transaction_id"
        >
          <VTooltip>
            <div class="v-table-wallet-transactions__transaction-id is--small-2">
              ID {{ investment?.payment_data?.transaction_id }}
            </div>
            <template #content>
              {{ investment?.payment_data?.transaction_id }}
            </template>
          </VTooltip>
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
            {{ investment.amountFormatted }}
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
