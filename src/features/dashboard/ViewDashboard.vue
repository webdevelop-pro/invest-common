<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { DashboardTabTypes } from './utils';
import DashboardTopInfo from './components/DashboardTopInfo.vue';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import { computed, PropType } from 'vue';
import {
  ROUTE_DASHBOARD_PORTFOLIO, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_WALLET,
  ROUTE_DASHBOARD_DISTRIBUTIONS, ROUTE_DASHBOARD_EVMWALLET,
} from 'InvestCommon/domain/config/enums/routes';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import DashboardPortfolio from 'InvestCommon/features/investment/DashboardPortfolio.vue';
import DashboardAccountDetails from 'InvestCommon/features/profiles/DashboardAccountDetails.vue';
import DashboardWallet from 'InvestCommon/features/wallet/DashboardWallet.vue';
import DashboardEvm from 'InvestCommon/features/cryptoWallet/DashboardEvm.vue';
import DashboardDistributions from 'InvestCommon/features/distributions/DashboardDistributions.vue';

defineProps({
  tab: {
    type: String as PropType<DashboardTabTypes>,
    required: true,
    validator: (prop: DashboardTabTypes) => prop in DashboardTabTypes,
  },
});

const globalLoader = useGlobalLoader();
globalLoader.hide();

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

const tabs = computed(() => ({
  [DashboardTabTypes.portfolio]: {
    value: DashboardTabTypes.portfolio,
    label: 'Portfolio',
    to: { name: ROUTE_DASHBOARD_PORTFOLIO, params: { profileId: selectedUserProfileId.value } },
  },
  [DashboardTabTypes.acount]: {
    value: DashboardTabTypes.acount,
    label: 'Profile Details',
    to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
  },
  [DashboardTabTypes.wallet]: {
    value: DashboardTabTypes.wallet,
    label: 'Wallet',
    to: { name: ROUTE_DASHBOARD_WALLET, params: { profileId: selectedUserProfileId.value } },
  },
  [DashboardTabTypes.evmwallet]: {
    value: DashboardTabTypes.evmwallet,
    label: 'Crypto Wallet',
    to: { name: ROUTE_DASHBOARD_EVMWALLET, params: { profileId: selectedUserProfileId.value } },
  },
  [DashboardTabTypes.distributions]: {
    value: DashboardTabTypes.distributions,
    label: 'Distributions',
    // subTitle: '+1',
    to: { name: ROUTE_DASHBOARD_DISTRIBUTIONS, params: { profileId: selectedUserProfileId.value } },
  },
}) as const);
</script>

<template>
  <VPageTopInfoAndTabs
    :tab="tab"
    :tabs="tabs"
    class="ViewDashboard view-dashboard is--no-margin"
  >
    <template #top-info>
      <DashboardTopInfo />
    </template>
    <template #tabs-content>
      <VTabsContent
        :value="tabs.portfolio.value"
      >
        <DashboardPortfolio />
      </VTabsContent>
      <VTabsContent
        :value="tabs.acount.value"
      >
        <DashboardAccountDetails />
      </VTabsContent>
      <VTabsContent
        :value="tabs.wallet.value"
      >
        <DashboardWallet />
      </VTabsContent>
      <VTabsContent
        :value="tabs.evmwallet.value"
      >
        <DashboardEvm />
      </VTabsContent>
      <VTabsContent
        :value="tabs.distributions.value"
      >
        <DashboardDistributions />
      </VTabsContent>
    </template>
  </VPageTopInfoAndTabs>
</template>

<style lang="scss">
.view-dashboard {
  margin-bottom: 90px;

  @include media-lte(tablet) {
    margin-bottom: 60px;
  }
}
</style>
