<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { DashboardTabTypes } from './utils';
import DashboardTabSkeleton from './components/DashboardTabSkeleton.vue';
import DashboardPageHeaderSkeleton from './components/DashboardPageHeaderSkeleton.vue';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import {
  computed,
  PropType,
  ref,
  watch,
  onMounted,
  type Component,
  defineAsyncComponent,
} from 'vue';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import { useMobileAppShell } from 'InvestCommon/domain/mobile/useMobileAppShell';
import { useSyncWithUrl } from 'UiKit/composables/useSyncWithUrl';
import VOfflineDataUnavailable from 'InvestCommon/shared/components/pwa/VOfflineDataUnavailable.vue';
import { useDashboardOfflineTabState } from './composables/useDashboardOfflineTabState';
import { useRoute } from 'vue-router';

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

const { isTablet } = useBreakpoints();
const { usesMobileAppShell } = useMobileAppShell();
const route = useRoute();
const isMobileAppShellDashboard = computed(() => isTablet.value && usesMobileAppShell.value);
const dashboardTabValues = new Set(Object.values(DashboardTabTypes));

const normalizeDashboardTab = (tab: string | null | undefined): DashboardTabTypes | undefined => {
  if (tab === 'account') return DashboardTabTypes.acount;
  if (tab && dashboardTabValues.has(tab as DashboardTabTypes)) return tab as DashboardTabTypes;
  return undefined;
};

const createTabRouteTarget = (tab: DashboardTabTypes) => {
  const nextQuery = { ...route.query };

  if (tab === props.tab) {
    delete nextQuery.tab;
  } else {
    nextQuery.tab = tab;
  }

  return {
    path: route.path,
    query: nextQuery,
  };
};

const tabs = computed(() => ({
  [DashboardTabTypes.summary]: {
    value: DashboardTabTypes.summary,
    label: 'Summary',
    to: createTabRouteTarget(DashboardTabTypes.summary),
  },
  [DashboardTabTypes.portfolio]: {
    value: DashboardTabTypes.portfolio,
    label: 'Portfolio',
    to: createTabRouteTarget(DashboardTabTypes.portfolio),
  },
  [DashboardTabTypes.acount]: {
    value: DashboardTabTypes.acount,
    label: 'Profile Details',
    to: createTabRouteTarget(DashboardTabTypes.acount),
  },
  [DashboardTabTypes.wallet]: {
    value: DashboardTabTypes.wallet,
    label: 'Wallet',
    to: createTabRouteTarget(DashboardTabTypes.wallet),
  },
  [DashboardTabTypes.distributions]: {
    value: DashboardTabTypes.distributions,
    label: 'Distributions',
    // subTitle: '+1',
    to: createTabRouteTarget(DashboardTabTypes.distributions),
  },
  [DashboardTabTypes.earn]: {
    value: DashboardTabTypes.earn,
    label: 'Earn',
    to: createTabRouteTarget(DashboardTabTypes.earn),
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

const tabTopLeftLoaders: Record<DashboardTabTypes, () => Promise<Component>> = {
  [DashboardTabTypes.portfolio]: () =>
    import('InvestCommon/features/investment/DashboardPortfolioTopLeft.vue'),
  [DashboardTabTypes.summary]: () =>
    import('InvestCommon/features/summary/DashboardSummaryTopLeft.vue'),
  [DashboardTabTypes.acount]: () =>
    import('InvestCommon/features/profiles/DashboardProfilesTopLeft.vue'),
  // Wallet and Crypto Wallet are combined into a single tab
  [DashboardTabTypes.wallet]: () =>
    import('InvestCommon/features/wallet/DashboardWalletTopLeft.vue'),
  [DashboardTabTypes.distributions]: () =>
    import('InvestCommon/features/distributions/DashboardDistributionsTopLeft.vue'),
  [DashboardTabTypes.earn]: () =>
    import('InvestCommon/features/earn/DashboardEarnTopLeft.vue'),
};

const createTabComponent = (loader: () => Promise<Component>) =>
  defineAsyncComponent({
    loader,
    loadingComponent: DashboardTabSkeleton,
    delay: 0,
  });

const DashboardPageHeader = defineAsyncComponent({
  loader: () => import('./components/DashboardPageHeader.vue'),
  loadingComponent: DashboardPageHeaderSkeleton,
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

const tabTopLeftComponents: Record<DashboardTabTypes, Component> = {
  [DashboardTabTypes.portfolio]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.portfolio]),
  [DashboardTabTypes.summary]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.summary]),
  [DashboardTabTypes.acount]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.acount]),
  [DashboardTabTypes.wallet]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.wallet]),
  [DashboardTabTypes.evmwallet]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.evmwallet]),
  [DashboardTabTypes.distributions]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.distributions]),
  [DashboardTabTypes.earn]: createTabComponent(tabTopLeftLoaders[DashboardTabTypes.earn]),
};

// VTabs controls the active tab via URL query param `tab`.
// Keep this view synced so we can lazy-create only the active tab's component.
const selectedTab = useSyncWithUrl<string>({
  key: 'tab',
  defaultValue: props.tab,
  syncToUrl: true,
  parse: (value) => normalizeDashboardTab(value) ?? props.tab,
});

const activeTab = computed<DashboardTabTypes>(() => {
  const maybeTab = normalizeDashboardTab(selectedTab.value);
  if (maybeTab) return maybeTab;
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
    void tabTopLeftLoaders[tab]?.();
  },
  { immediate: true },
);

const currentPwaComponent = computed(() => (
  tabComponents[activeTab.value] ?? tabComponents[DashboardTabTypes.portfolio]));
const {
  activeTabCopy,
  shouldShowUnavailableState,
} = useDashboardOfflineTabState(activeTab);

</script>

<template>
  <VPageTopInfoAndTabs
    :tab="activeTab"
    :tabs="filteredTabs"
    :hide-tabs="isMobileAppShellDashboard"
    class="ViewDashboard view-dashboard is--no-margin"
  >
    <template #top-info>
      <DashboardPageHeader
        :active-tab="activeTab"
        :tab-top-left-components="tabTopLeftComponents"
      />
    </template>
    <template #tabs-content>
      <template v-if="isMobileAppShellDashboard">
        <VOfflineDataUnavailable
          v-if="shouldShowUnavailableState"
          :title="activeTabCopy.title"
          :message="activeTabCopy.message"
          :detail="activeTabCopy.detail"
        />
        <component
          :is="currentPwaComponent"
          v-else
          :key="activeTab"
        />
      </template>
      <template v-else>
        <VTabsContent
          v-for="item in tabsList"
          :key="item.value"
          :value="item.value"
        >
          <VOfflineDataUnavailable
            v-if="item.value === activeTab && shouldShowUnavailableState"
            :title="activeTabCopy.title"
            :message="activeTabCopy.message"
            :detail="activeTabCopy.detail"
          />
          <component
            :is="tabComponents[item.value]"
            v-else-if="loadedTabs.includes(item.value)"
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
