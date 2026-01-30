<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { DashboardTabTypes } from './utils';
import DashboardTopInfo from './components/DashboardTopInfo.vue';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import { computed, PropType, watch, onMounted, nextTick, type Component } from 'vue';
import {
  ROUTE_DASHBOARD_PORTFOLIO, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_WALLET,
  ROUTE_DASHBOARD_DISTRIBUTIONS, ROUTE_DASHBOARD_EVMWALLET, ROUTE_DASHBOARD_SUMMARY,
  ROUTE_DASHBOARD_EARN,
} from 'InvestCommon/domain/config/enums/routes';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import DashboardPortfolio from 'InvestCommon/features/investment/DashboardPortfolio.vue';
import DashboardAccountDetails from 'InvestCommon/features/profiles/DashboardAccountDetails.vue';
import DashboardWallet from 'InvestCommon/features/wallet/DashboardWallet.vue';
import DashboardEvm from 'InvestCommon/features/cryptoWallet/DashboardEvm.vue';
import DashboardDistributions from 'InvestCommon/features/distributions/DashboardDistributions.vue';
import DashboardSummary from 'InvestCommon/features/summary/DashboardSummary.vue';
import DashboardEarn from 'InvestCommon/features/earn/DashboardEarn.vue';
import { useRoute } from 'vue-router';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

defineProps({
  tab: {
    type: String as PropType<DashboardTabTypes>,
    required: true,
    validator: (prop: DashboardTabTypes) => prop in DashboardTabTypes,
  },
});

const globalLoader = useGlobalLoader();
onMounted(() => {
  globalLoader.hide();
});

const route = useRoute();

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

const { isTablet } = useBreakpoints();

const tabs = computed(() => ({
  [DashboardTabTypes.summary]: {
    value: DashboardTabTypes.summary,
    label: 'Summary',
    to: { name: ROUTE_DASHBOARD_SUMMARY, params: { profileId: selectedUserProfileId.value } },
  },
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
  [DashboardTabTypes.earn]: {
    value: DashboardTabTypes.earn,
    label: 'Earn',
    to: { name: ROUTE_DASHBOARD_EARN, params: { profileId: selectedUserProfileId.value } },
  },
}) as const);

const filteredTabs = computed(() => {
  const allTabs = { ...tabs.value };
  // Hide distributions tab on mobile
  if (isTablet.value) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [DashboardTabTypes.distributions]: _, ...rest } = allTabs;
    return rest;
  }
  return allTabs;
});

const tabsList = computed(() => {
  const allTabs = Object.values(filteredTabs.value);
  return allTabs;
});

const tabComponents: Record<DashboardTabTypes, Component> = {
  [DashboardTabTypes.portfolio]: DashboardPortfolio,
  [DashboardTabTypes.acount]: DashboardAccountDetails,
  [DashboardTabTypes.wallet]: DashboardWallet,
  [DashboardTabTypes.evmwallet]: DashboardEvm,
  [DashboardTabTypes.distributions]: DashboardDistributions,
  [DashboardTabTypes.summary]: DashboardSummary,
  [DashboardTabTypes.earn]: DashboardEarn,
};

watch(
  () => route.path,
  async () => {
    await nextTick();
    globalLoader.hide();
  },
);

</script>

<template>
  <VPageTopInfoAndTabs
    :tab="tab"
    :tabs="filteredTabs"
    class="ViewDashboard view-dashboard is--no-margin"
  >
    <template #top-info>
      <DashboardTopInfo />
    </template>
    <template #tabs-content>
      <VTabsContent
        v-for="item in tabsList"
        :key="item.value"
        :value="item.value"
      >
        <component :is="tabComponents[item.value]" />
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
