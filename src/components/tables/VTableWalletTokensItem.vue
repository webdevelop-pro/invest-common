<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import externalLink from 'UiKit/assets/images/external-link.svg';

interface ITableEvmWalletTransaction {
  name: string;
  amount: string;
  symbol: string;
  address: string;
}

defineProps({
  data: Object as PropType<ITableEvmWalletTransaction>,
  loading: Boolean,
});

</script>

<template>
  <VTableRow
    class="VTableWalletTokensItem v-table-wallet-tokens-item"
  >
    <VTableCell>
      {{ data?.name }}
    </VTableCell>
    <VTableCell>
      <a
        v-if="data?.address"
        :href="`https://sepolia.etherscan.io/token/${data?.address}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ data?.symbol }}
      </a>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-tokens-item__table-amount is--h6__title">
        {{ data?.amount }}
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-tokens-item__link">
        <a
          v-if="data?.address"
          :href="`https://sepolia.etherscan.io/token/${data?.address}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <externalLink
            alt="external link icon"
            class="v-table-wallet-tokens-item__link-icon"
          />
          <span class="is--hidden">
            Token {{ data?.address }} link
          </span>
        </a>
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-tokens-item {

  &__table-amount {
    text-align: right;
    color: $black;
  }

  &__table-type {
    display: flex;
  }

  &__link-icon {
    width: 14px;
    height: 16px;
    color: $primary;
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
