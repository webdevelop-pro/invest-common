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

  .v-table-cell {
    &:nth-child(2) {
      width: 135px;

      @media screen and (width < $desktop){
        text-align: right;
      }
    }

    &:nth-child(1),
    &:nth-child(2) {
      @media screen and (width < $desktop){
        flex: 0 0 50%;
      }
    }

    &:nth-child(4) {
      @media screen and (width < $desktop){
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &:nth-child(5) {
      @media screen and (width < $desktop){
        display: flex;
        align-items: center;
        justify-content: end;
      }
    }
  }
}
</style>
