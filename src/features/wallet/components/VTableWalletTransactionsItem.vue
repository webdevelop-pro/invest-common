<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import { ITransactionDataFormatted } from 'InvestCommon/data/wallet/wallet.types';

defineProps({
  data: Object as PropType<ITransactionDataFormatted>,
  loading: Boolean,
});

</script>

<template>
  <VTableRow
    class="VTableWalletTransactions v-table-wallet-transactions"
  >
    <VTableCell>
      <div>
        {{ data?.updated_at_date }}
      </div>
      <div class="is--color-gray-60">
        {{ data?.updated_at_time }}
      </div>
    </VTableCell>
    <VTableCell>
      <VTooltip v-if="data?.entity_id">
        <div class="v-table-wallet-transactions__transaction-id is--small-2">
          ID {{ data?.entity_id }}
        </div>
        <template #content>
          {{ data?.entity_id }}
        </template>
      </VTooltip>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-transactions__table-type">
        <VBadge
          size="small"
          :color="data?.tagColor"
          class="profile-status-info__tag"
        >
          {{ data?.typeFormatted }}
        </VBadge>
      </div>
    </VTableCell>
    <VTableCell>
      <VTooltip>
        <span
          class="is--small"
        >
          {{ data?.statusFormated?.text }}
        </span>
        <template #content>
          <p>
            {{ data?.statusFormated?.tooltip }}
          </p>
        </template>
      </VTooltip>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-transactions__table-amount is--h6__title">
        {{ data?.amountFormatted }}
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-transactions {
  @media screen and (width < $desktop){
    display: flex;
    flex-wrap: wrap;
  }

  &__table-amount {
    text-align: right;
    color: $black;
    width: max-content;
  }

  &__table-type {
    display: flex;
  }

  &__transaction-id {
    color: $gray-80;
    // width: 18%;
    max-width: 110px;
    width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
