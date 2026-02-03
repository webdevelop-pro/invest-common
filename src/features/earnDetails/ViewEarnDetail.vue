<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { DashboardEarnTabTypes } from './utils';
import VBreadcrumbs from 'UiKit/components/VBreadcrumb/VBreadcrumbsList.vue';
import { PropType } from 'vue';
import { storeToRefs } from 'pinia';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import EarnTopInfo from './components/EarnTopInfo.vue';
import EarnOverview from './components/EarnOverview.vue';
import EarnYourPosition from './components/EarnYourPosition.vue';
import EarnRisk from './components/EarnRisk.vue';
import { useEarnDetail } from './useEarnDetail';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import VDialogCryptoWallet from 'InvestCommon/features/cryptoWallet/components/VDialogCryptoWallet.vue';

defineProps({
  tab: {
    type: String as PropType<DashboardEarnTabTypes>,
    required: true,
    validator: (prop: string) => Object.values(DashboardEarnTabTypes).includes(prop as DashboardEarnTabTypes),
  },
});

const globalLoader = useGlobalLoader();
globalLoader.hide();

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

// All earn detail logic
const {
  poolId,
  poolData,
  overviewSections,
  loading,
  topInfoData,
  formattedRiskData,
  riskLoading,
  ratingColorToCssColor,
  onBackClick,
  coinBalance,
  walletLoading,
  stats,
  transactions,
  positionsLoading,
  isDialogTransactionOpen,
  transactionType,
  onExchangeClick,
  breadcrumbs,
  tabs,
  getEvmWalletState,
} = useEarnDetail();
</script>

<template>
  <VPageTopInfoAndTabs
    :tab="tab"
    :tabs="tabs"
    class="ViewEarnDetail view-earn-detail is--no-margin"
  >
    <template #top-info>
      <EarnTopInfo
        :pool-data="poolData"
        :loading="loading"
        :info-data="topInfoData"
        :profile-id="selectedUserProfileId"
        :coin-balance="coinBalance"
        :wallet-loading="walletLoading"
        @back-click="onBackClick"
        @exchange-click="onExchangeClick"
      />
    </template>
    <template #tabs-content>
      <VTabsContent
        :value="tabs.overview.value"
      >
        <EarnOverview
          :sections="overviewSections"
        />
      </VTabsContent>
      <VTabsContent
        :value="tabs['your-position'].value"
      >
        <EarnYourPosition
          :stats="stats"
          :transactions="transactions"
          :loading="positionsLoading"
          :pool-id="poolId"
          :profile-id="selectedUserProfileId"
          :symbol="poolData?.symbol"
        />
      </VTabsContent>
      <VTabsContent
        :value="tabs.risk.value"
      >
        <EarnRisk
          :formatted-risk-data="formattedRiskData"
          :loading="riskLoading"
          :rating-color-to-css-color="ratingColorToCssColor"
        />
      </VTabsContent>
    </template>
    <template #content>
      <div class="view-earn-detail__breadcrumbs-wrap">
        <div class="wd-container">
          <VBreadcrumbs
            :data="breadcrumbs"
            class="view-earn-detail__breadcrumbs"
          />
        </div>
      </div>
    </template>
  </VPageTopInfoAndTabs>
  <VDialogCryptoWallet
    v-model="isDialogTransactionOpen"
    :transaction-type="transactionType"
    :data="getEvmWalletState.data"
    :default-buy-symbol="poolData?.symbol"
    :pool-id="poolId"
    :profile-id="selectedUserProfileId"
  />
</template>

<style lang="scss">
.view-earn-detail {

  &__breadcrumbs-wrap {
    width: 100%;
    background: $white;
    padding-top: 130px;

    @media screen and (max-width: $tablet){
      padding-top: 40px;
    }
  }
}
</style>

