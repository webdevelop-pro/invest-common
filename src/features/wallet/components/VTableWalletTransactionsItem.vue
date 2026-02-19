<script setup lang="ts">
import { type PropType } from 'vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';
import type { ITransactionDataFormatted } from 'InvestCommon/data/wallet/wallet.types';
import { useVTableWalletTransactionsItem } from './logic/useVTableWalletTransactionsItem';

const props = defineProps({
  data: Object as PropType<IEvmTransactionDataFormatted | ITransactionDataFormatted>,
  loading: Boolean,
});

const { fullTxOrEntityId } = useVTableWalletTransactionsItem(props.data);
</script>

<template>
  <VTableRow class="VTableWalletTransactionsItem v-table-wallet-transactions-item">
    <VTableCell class="v-table-wallet-transactions-item__date-cell">
      <div class="v-table-wallet-transactions-item__date">
        <div>{{ data?.submitted_at_date }}</div>
        <div class="is--color-gray-60 is--small-2">
          {{ data?.submitted_at_time }}
        </div>
      </div>
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
      <span class="v-table-wallet-transactions-item__type is--small-2">
        {{ data?.typeDisplay }}
      </span>
    </VTableCell>

    <VTableCell>
      <div class="v-table-wallet-transactions-item__type is--small-2 is--lt-tablet-show">
        {{ data?.typeDisplay }}
      </div>
      <VTooltip v-if="fullTxOrEntityId">
        <div class="v-table-wallet-transactions-item__tx">
          <a
            v-if="data?.transaction_tx"
            :href="data?.scanTxUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="v-table-wallet-transactions-item__tx-link is--link-2"
          >
            {{ data?.txShort }}
          </a>
          <span
            v-else
            class="is--small-2"
          >
            {{ data?.txShort || '—' }}
          </span>
          <div
            v-if="data?.networkFormatted"
            class="is--color-gray-60 is--small v-table-wallet-transactions-item__network"
          >
            {{ data.networkFormatted }}
          </div>
        </div>
        <template #content>
          {{ fullTxOrEntityId }}
        </template>
      </VTooltip>
      <div
        v-else
        class="v-table-wallet-transactions-item__tx is--small-2 is--gt-tablet-show"
      >
        <span class="is--color-gray-60">—</span>
      </div>
      <div class="v-table-wallet-transactions-item__description is--small is--lt-tablet-show">
        {{ data?.description }}
      </div>
    </VTableCell>
    <VTableCell class="is--gt-tablet-show">
      <span class="v-table-wallet-transactions-item__description is--small">
        {{ data?.description }}
      </span>
    </VTableCell>
    <VTableCell class="is--gt-tablet-show">
      <VBadge
        :color="(data?.statusColor as 'secondary-light' | 'default' | 'red-light' | 'primary' | 'purple-light' | undefined)"
        size="small"
        class="v-table-wallet-transactions-item__status"
      >
        {{ data?.statusText }}
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-wallet-transactions-item__amount-cell">
      <div
        class="v-table-wallet-transactions-item__amount is--body"
      >
        {{ data?.amountFormatted }}
      </div>

      <VBadge
        :color="(data?.statusColor as 'secondary-light' | 'default' | 'red-light' | 'primary' | 'purple-light' | undefined)"
        size="small"
        class="v-table-wallet-transactions-item__status is--lt-tablet-show"
      >
        {{ data?.statusText }}
      </VBadge>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-transactions-item {
  &__date {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__date-cell {
    @media screen and (width < $tablet) {
      vertical-align: top;
    }
  }

  &__tx {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: initial;
  }

  &__tx-link {
    text-decoration: underline;
    width: fit-content;
  }

  &__network {
    margin-top: 2px;
  }

  &__type {
    @media screen and (width < $tablet) {
      margin-bottom: 12px;
    }
  }

  &__description {
    max-width: 280px;

    @media screen and (width < $tablet) {
      max-width: 100%;
      margin-top: 12px;
    }
  }

  &__status {
    width: fit-content;
  }

  &__amount {
    text-align: right;
    width: max-content;
    margin-left: auto;
    color: $black;

    &.is--positive {
      color: $secondary;
    }

    &.is--negative {
      color: $red;
    }
  }

  &__amount-cell {
    @media screen and (width < $tablet) {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }
  }
}
</style>
