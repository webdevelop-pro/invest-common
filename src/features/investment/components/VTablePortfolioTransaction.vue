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

const date = computed(() => (
  props.investment.payment_data.updated_at
    ? props.investment.paymentDataUpdatedAtFormatted : props.investment.paymentDataCreatedAtFormatted));
const time = computed(() => (
  props.investment.payment_data.updated_at
    ? props.investment.paymentDataUpdatedAtTime : props.investment.paymentDataCreatedAtTime));
</script>

<template>
  <VTable
    size="small"
    class="VTablePortfolioTransaction v-table-portfolio-transaction"
  >
    <VTableBody>
      <VTableRow class="v-table-portfolio-transaction__row">
        <VTableCell>
          <div>
            {{ date }}
          </div>
          <div class="v-table-portfolio-transaction__time">
            {{ time }}
          </div>
        </VTableCell>

        <VTableCell
          v-if="investment?.payment_data?.transaction_id"
          class="v-table-portfolio-transaction__transaction-cell"
        >
          <div class="v-table-portfolio-transaction__type is--lt-tablet-show">
            <VBadge
              size="small"
              class="is--background-purple-light"
            >
              Investment
            </VBadge>
          </div>

          <VTooltip class="v-table-wallet-transactions__tooltip">
            <div class="v-table-wallet-transactions__transaction-id is--small-2">
              ID {{ investment?.payment_data?.transaction_id }}
            </div>
            <template #content>
              {{ investment?.payment_data?.transaction_id }}
            </template>
          </VTooltip>
        </VTableCell>

        <VTableCell class="is--gt-tablet-show">
          <div class="v-table-portfolio-transaction__type">
            <VBadge
              size="small"
              class="is--background-purple-light"
            >
              Investment
            </VBadge>
          </div>
        </VTableCell>

        <VTableCell class="is--gt-tablet-show">
          {{ InvestTransactionStatuses[investment.funding_status]?.text }}
        </VTableCell>
  
        <VTableCell class="v-table-portfolio-transaction__amount-cell">
          <div class="v-table-portfolio-transaction__amount is--h6__title">
            {{ investment.amountFormatted }}
          </div>

          <div class="is--lt-tablet-show">
            {{ InvestTransactionStatuses[investment.funding_status]?.text }}
          </div>
        </VTableCell>
      </VTableRow>
    </VTableBody>
  </VTable>
</template>

<style lang="scss">
.v-table-portfolio-transaction {
  &__row {
    width: 100%;

    @media screen and (width < $desktop){
      display: flex;
      flex-wrap: wrap;
    }
  }

  &__amount {
    color: $black;
    text-align: right;

    @media screen and (width < $tablet){
      margin-bottom: 12px !important;
    }
  }

  &__time {
    color: $gray-60;
  }

  &__type {
    display: flex;

    @media screen and (width < $tablet){
      margin-bottom: 12px;
    }
  }

  &__transaction-id {
    color: $gray-80;
  }

  &__amount-cell {
    @media screen and (width < $tablet){
      text-align: right;
    }
  }
}
</style>
