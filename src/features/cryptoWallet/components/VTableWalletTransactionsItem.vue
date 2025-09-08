<script setup lang="ts">
import VTableCell from 'UiKit/components/Base/VTable/VTableCell.vue';
import VTableRow from 'UiKit/components/Base/VTable/VTableRow.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import externalLink from 'UiKit/assets/images/external-link.svg';
import env from 'InvestCommon/domain/config/env';
import { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';

interface Props {
  data?: IEvmTransactionDataFormatted;
  loading?: boolean;
}

defineProps<Props>();

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
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
      <div
        v-if="data?.symbol"
        class="v-table-wallet-transactions-item__asset"
      >
        <VImage
          v-if="data?.icon"
          :src="data.icon"
          :alt="data?.symbol"
          fit="cover"
          class="v-table-wallet-transactions-item__asset-icon"
        />
        <a
          v-if="data?.address"
          :href="`${env.CRYPTO_WALLET_SCAN_URL}/token/${data?.address}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ data?.symbol }}
        </a>
      </div>
    </VTableCell>
    
    <VTableCell>
      <VBadge
        :color="data?.tagColor"
        size="small"
      >
        <span class="is--h6__title">
          {{ data?.amountFormatted }}
        </span>
      </VBadge>
    </VTableCell>
    
    <VTableCell>
      <router-link
        v-if="data?.investment_id"
        :to="{
          name: ROUTE_INVESTMENT_DOCUMENTS,
          params: { profileId: selectedUserProfileId, id: data?.investment_id }
        }"
        class="is--link-1 v-table-wallet-transactions-item__link-investment"
      >
        {{ data?.investment_id }}
      </router-link>
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
        <span class="is--small-2">
          {{ data?.networkFormatted }}
        </span>
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-transactions-item {
  &__link {
    display: flex;
    align-items: end;
    justify-content: end;
    flex-direction: column;
  }

  &__asset {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__asset-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__asset-symbol {
    color: $gray-80;
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

  &__link-investment {
    color: $gray-80;
    text-decoration: none;

    &:hover {
      color: $primary !important;
    }
  }
}
</style>
