<script setup lang="ts">
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import externalLink from 'UiKit/assets/images/external-link.svg';
import env from 'InvestCommon/domain/config/env';
import { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';

interface Props {
  data?: IEvmTransactionDataFormatted;
  loading?: boolean;
}

defineProps<Props>();
</script>

<template>
  <VTableRow class="VTableWalletTransactionsItem v-table-wallet-transactions-item">
    <VTableCell>
      <div>
        {{ data?.updated_at_date }}
      </div>
      <div class="is--color-gray-60">
        {{ data?.updated_at_time }}
      </div>
    </VTableCell>
    
    <VTableCell>
      <VBadge
        :color="data?.tagColor"
        size="small"
      >
        {{ data?.typeFormatted }}
      </VBadge>
    </VTableCell>
    
    <VTableCell>
      {{ data?.amountFormatted }}
    </VTableCell>
    
    <VTableCell>
      {{ data?.networkFormatted }}
    </VTableCell>
    
    <VTableCell>
      <VBadge
        :color="data?.statusColor"
        size="small"
      >
        {{ data?.statusText }}
      </VBadge>
    </VTableCell>
    
    <VTableCell>
      <div class="v-table-wallet-transactions-item__link">
        <a
          v-if="data?.transaction_tx"
          :href="`${env.CRYPTO_WALLET_SCAN_URL}/tx/${data.transaction_tx}`"
          target="_blank"
          rel="noopener noreferrer"
          class="v-table-wallet-transactions-item__hash-link is--link-2"
        >
          <span class="v-table-wallet-transactions-item__hash">
            {{ data.transaction_tx.slice(0, 8) }}...{{ data.transaction_tx.slice(-6) }}
          </span>
          <externalLink
            alt="External link icon"
            class="v-table-wallet-transactions-item__link-icon"
          />
        </a>
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-transactions-item {
  &__link {
    display: flex;
    align-items: center;
    justify-content: end;
  }

  &__hash-link {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__link-icon {
    width: 14px;
    height: 16px;
    color: $primary;
  }
}
</style>
