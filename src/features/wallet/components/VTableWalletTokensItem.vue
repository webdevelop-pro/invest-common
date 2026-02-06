<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import externalLink from 'UiKit/assets/images/external-link.svg';
import infoIcon from 'UiKit/assets/images/circle-info.svg';
import env from 'InvestCommon/domain/config/env';
import { currency } from 'InvestCommon/helpers/currency';

interface ITableEvmWalletTransaction {
  name?: string;
  amount: string | number;
  symbol: string;
  address: string;
  icon?: string;
  price_per_usd?: number;
}

const props = defineProps({
  data: Object as PropType<ITableEvmWalletTransaction>,
  loading: Boolean,
});

const tokenValue = computed(() => {
  const d = props.data;
  if (!d?.amount || !d.price_per_usd) return undefined;
  const amountNum = Number(d.amount);
  const priceNum = Number(d.price_per_usd);
  if (!Number.isFinite(amountNum) || !Number.isFinite(priceNum)) return undefined;
  return currency(amountNum * priceNum);
});
</script>

<template>
  <VTableRow
    class="VTableWalletTokensItem v-table-wallet-tokens-item"
  >
    <VTableCell>
      <div class="v-table-wallet-tokens-item__token">
        <div class="v-table-wallet-tokens-item__token-icon-wrap">
          <VImage
            v-if="data?.icon"
            :src="data.icon"
            :alt="`${data?.name || data?.symbol} token icon`"
            fit="cover"
            class="v-table-wallet-tokens-item__token-icon"
          />
        </div>
        <div class="v-table-wallet-tokens-item__token-text">
          <div class="v-table-wallet-tokens-item__token-name is--h6__title">
            {{ data?.name || data?.symbol }}
          </div>
          <div class="v-table-wallet-tokens-item__token-symbol is--small is--color-gray-60">
            {{ data?.symbol }}
          </div>
        </div>
      </div>
    </VTableCell>

    <VTableCell>
      <div class="v-table-wallet-tokens-item__amount">
        {{ data?.amount }}
      </div>
    </VTableCell>

    <VTableCell>
      <div class="v-table-wallet-tokens-item__value">
        <span class="v-table-wallet-tokens-item__value-amount">
          {{ tokenValue ?? '—' }}
        </span>
        <VTooltip class="v-table-wallet-tokens-item__value-tooltip">
          <infoIcon class="v-table-wallet-tokens-item__info-icon" />
          <template #content>
            This is the token's Book Value (cost or most recent appraisal), not a real-time market price.
          </template>
        </VTooltip>
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
  &__token {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__token-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  &__token-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  &__token-name {
    color: $black;
  }

  &__token-symbol {
    color: $gray-60;
  }

  &__amount {
    color: $black;
  }

  &__value {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    color: $black;
  }

  &__value-amount {
    color: $black;
  }

  &__info-icon {
    width: 14px;
    height: 14px;
    color: $gray-60;
    display: block;
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__link-icon {
    width: 14px;
    height: 16px;
    color: $primary;
  }
}
</style>

