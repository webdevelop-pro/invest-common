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
      <VTooltip>
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
          {{ data?.type[0]?.toUpperCase() + data?.type?.slice(1) }}
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

  &__table-amount {
    text-align: right;
    color: $black;
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
}
</style>
