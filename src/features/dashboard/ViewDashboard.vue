<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { DashboardTabTypes } from './utils';
import DashboardTopInfo from './components/DashboardTopInfo.vue';
import DashboardTabSkeleton from './components/DashboardTabSkeleton.vue';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import {
  computed,
  PropType,
  ref,
  watch,
  onMounted,
  type Component,
  defineAsyncComponent,
} from 'vue';
import {
  ROUTE_DASHBOARD_PORTFOLIO,
  ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_WALLET,
  ROUTE_DASHBOARD_DISTRIBUTIONS,
  ROUTE_DASHBOARD_SUMMARY,
  ROUTE_DASHBOARD_EARN,
} from 'InvestCommon/domain/config/enums/routes';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import { useMobileAppShell } from 'InvestCommon/domain/mobile/useMobileAppShell';
import { useSyncWithUrl } from 'UiKit/composables/useSyncWithUrl';

const props = defineProps({
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

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

const { isTablet } = useBreakpoints();
const { usesMobileAppShell } = useMobileAppShell();
const isMobileAppShellDashboard = computed(() => isTablet.value && usesMobileAppShell.value);

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
  if (isMobileAppShellDashboard.value) {
    return {
      [DashboardTabTypes.portfolio]: allTabs[DashboardTabTypes.portfolio],
    };
  }
  // Hide distributions tab on mobile
  if (isTablet.value) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [DashboardTabTypes.distributions]: _, ...rest } = allTabs;
    return rest;
  }
  return allTabs;
});

const tabsList = computed(() => Object.values(filteredTabs.value));

const tabLoaders: Record<DashboardTabTypes, () => Promise<Component>> = {
  [DashboardTabTypes.portfolio]: () =>
    import('InvestCommon/features/investment/DashboardPortfolio.vue'),
  [DashboardTabTypes.summary]: () =>
    import('InvestCommon/features/summary/DashboardSummary.vue'),
  [DashboardTabTypes.acount]: () =>
    import('InvestCommon/features/profiles/DashboardAccountDetails.vue'),
  // Wallet and Crypto Wallet are combined into a single tab
  [DashboardTabTypes.wallet]: () =>
    import('InvestCommon/features/wallet/DashboardWallet.vue'),
  [DashboardTabTypes.evmwallet]: () =>
    import('InvestCommon/features/wallet/DashboardWallet.vue'),
  [DashboardTabTypes.distributions]: () =>
    import('InvestCommon/features/distributions/DashboardDistributions.vue'),
  [DashboardTabTypes.earn]: () =>
    import('InvestCommon/features/earn/DashboardEarn.vue'),
};

const createTabComponent = (loader: () => Promise<Component>) =>
  defineAsyncComponent({
    loader,
    loadingComponent: DashboardTabSkeleton,
    delay: 0,
  });

const tabComponents: Record<DashboardTabTypes, Component> = {
  [DashboardTabTypes.portfolio]: createTabComponent(tabLoaders[DashboardTabTypes.portfolio]),
  [DashboardTabTypes.summary]: createTabComponent(tabLoaders[DashboardTabTypes.summary]),
  [DashboardTabTypes.acount]: createTabComponent(tabLoaders[DashboardTabTypes.acount]),
  [DashboardTabTypes.wallet]: createTabComponent(tabLoaders[DashboardTabTypes.wallet]),
  [DashboardTabTypes.evmwallet]: createTabComponent(tabLoaders[DashboardTabTypes.evmwallet]),
  [DashboardTabTypes.distributions]: createTabComponent(tabLoaders[DashboardTabTypes.distributions]),
  [DashboardTabTypes.earn]: createTabComponent(tabLoaders[DashboardTabTypes.earn]),
};

// VTabs controls the active tab via URL query param `tab`.
// Keep this view synced so we can lazy-create only the active tab's component.
const selectedTab = useSyncWithUrl<string>({
  key: 'tab',
  defaultValue: props.tab,
  syncToUrl: true,
});

const activeTab = computed<DashboardTabTypes>(() => {
  const maybeTab = selectedTab.value as DashboardTabTypes;
  if (maybeTab in tabLoaders) return maybeTab;
  if (props.tab in tabLoaders) return props.tab;
  return DashboardTabTypes.portfolio;
});

const loadedTabs = ref<DashboardTabTypes[]>([]);

watch(
  () => activeTab.value,
  (tab) => {
    if (!loadedTabs.value.includes(tab)) {
      loadedTabs.value = [...loadedTabs.value, tab];
    }
    // Warm the active tab chunk; component mount will also load if needed.
    void tabLoaders[tab]?.();
  },
  { immediate: true },
);

const currentPwaComponent = computed(() => (
  tabComponents[activeTab.value] ?? tabComponents[DashboardTabTypes.portfolio]));

</script>

<template>
  <VPageTopInfoAndTabs
    :tab="props.tab"
    :tabs="filteredTabs"
    :hide-tabs="isMobileAppShellDashboard"
    class="ViewDashboard view-dashboard is--no-margin"
  >
    <template #top-info>
      <DashboardTopInfo />
    </template>
    <template #tabs-content>
      <component
        :is="currentPwaComponent"
        v-if="isMobileAppShellDashboard"
        :key="activeTab"
      />
      <template v-else>
        <VTabsContent
          v-for="item in tabsList"
          :key="item.value"
          :value="item.value"
        >
          <component
            :is="tabComponents[item.value]"
            v-if="loadedTabs.includes(item.value)"
            v-show="item.value === activeTab"
          />
        </VTabsContent>
      </template>
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
