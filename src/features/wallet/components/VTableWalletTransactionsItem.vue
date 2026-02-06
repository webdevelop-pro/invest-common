<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';
import type { ITransactionDataFormatted } from 'InvestCommon/data/wallet/wallet.types';

const props = defineProps({
  data: Object as PropType<IEvmTransactionDataFormatted | ITransactionDataFormatted>,
  loading: Boolean,
});

const fullTxOrEntityId = computed(() => {
  const d = props.data;
  if (!d) return '';
  if (d.transaction_tx) return d.transaction_tx;
  const entityId = 'entity_id' in d ? (d as ITransactionDataFormatted).entity_id : undefined;
  if (entityId != null) return String(entityId);
  return '';
});
</script>

<template>
  <VTableRow class="VTableWalletTransactionsItem v-table-wallet-transactions-item">
    <VTableCell>
      <div class="v-table-wallet-transactions-item__date">
        <div>{{ data?.submitted_at_date }}</div>
        <div class="is--color-gray-60 is--small-2">
          {{ data?.submitted_at_time }}
        </div>
      </div>
    </VTableCell>
    <VTableCell>
      <span class="v-table-wallet-transactions-item__type is--small-2">
        {{ data?.typeDisplay }}
      </span>
    </VTableCell>
    <VTableCell>
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
        class="v-table-wallet-transactions-item__tx is--small-2"
      >
        <span class="is--color-gray-60">—</span>
      </div>
    </VTableCell>
    <VTableCell>
      <span class="v-table-wallet-transactions-item__description is--small">
        {{ data?.description }}
      </span>
    </VTableCell>
    <VTableCell>
      <VBadge
        :color="(data?.statusColor as 'secondary-light' | 'default' | 'red-light' | 'primary' | 'purple-light' | undefined)"
        size="small"
        class="v-table-wallet-transactions-item__status"
      >
        {{ data?.statusText }}
      </VBadge>
    </VTableCell>
    <VTableCell>
      <div
        class="v-table-wallet-transactions-item__amount"
      >
        {{ data?.amountFormatted }}
      </div>
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

  &__description {
    max-width: 280px;
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
}
</style>
