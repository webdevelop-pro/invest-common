<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import externalLink from 'UiKit/assets/images/external-link.svg';
import env from 'InvestCommon/domain/config/env';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';

interface ITableEvmWalletTransaction {
  name: string;
  amount: string;
  symbol: string;
  address: string;
  icon?: string;
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
      <div class="v-table-wallet-tokens-item__table-image-wrap">
        <VImage
          v-if="data?.icon"
          :src="data.icon"
          :alt="`${data.name} token icon`"
          fit="cover"
          class="v-table-wallet-tokens-item__table-image"
        />
      </div>
    </VTableCell>
    <VTableCell>
      {{ data?.name }}
    </VTableCell>
    <VTableCell>
      <a
        v-if="data?.address"
        :href="`${env.CRYPTO_WALLET_SCAN_URL}/token/${data?.address}`"
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
          :href="`${env.CRYPTO_WALLET_SCAN_URL}/token/${data?.address}`"
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
@use 'UiKit/styles/_variables.scss' as variables;

.v-table-wallet-tokens-item {

  &__table-amount {
    color: $black;
  }

  &__table-type {
    display: flex;
  }

  &__table-image-wrap {
    width: 25px;
    height: 25px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  &__table-image {
    width: 100%;
    height: 100%;
  }

  &__link-icon {
    width: 14px;
    height: 16px;
    color: $primary;
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: end;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
