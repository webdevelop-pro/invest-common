/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  computed,
  reactive,
  ref,
} from 'vue';
import ViewDashboard from '../ViewDashboard.vue';
import { DashboardTabTypes } from '../utils';

const routeState = reactive({
  path: '/profile/1031/distributions',
  query: {
    filter: 'open',
    tab: DashboardTabTypes.wallet,
  } as Record<string, string>,
});

const selectedTab = ref<string>(DashboardTabTypes.wallet);

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: () => ({
    hide: vi.fn(),
  }),
}));

vi.mock('UiKit/composables/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTablet: ref(false),
  }),
}));

vi.mock('InvestCommon/domain/mobile/useMobileAppShell', () => ({
  useMobileAppShell: () => ({
    usesMobileAppShell: ref(false),
  }),
}));

vi.mock('UiKit/composables/useSyncWithUrl', () => ({
  useSyncWithUrl: () => selectedTab,
}));

vi.mock('../composables/useDashboardOfflineTabState', () => ({
  useDashboardOfflineTabState: () => ({
    activeTabCopy: computed(() => ({
      title: 'Offline title',
      message: 'Offline message',
      detail: 'Offline detail',
    })),
    shouldShowUnavailableState: ref(false),
  }),
}));

vi.mock('InvestCommon/shared/components/VPageTopInfoAndTabs.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
    name: 'VPageTopInfoAndTabs',
    props: {
      tab: {
        type: String,
        required: true,
      },
      tabs: {
        type: Object,
        required: true,
      },
      hideTabs: {
        type: Boolean,
        default: false,
      },
    },
    template: '<div data-testid="page-top-info-and-tabs" />',
    }),
  };
});

vi.mock('UiKit/components/Base/VTabs', async () => {
  const { defineComponent } = await import('vue');

  return {
    VTabsContent: defineComponent({
      name: 'VTabsContent',
      template: '<div><slot /></div>',
    }),
  };
});

vi.mock('InvestCommon/features/wallet/DashboardWallet.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'DashboardWallet',
      template: '<div />',
    }),
  };
});

vi.mock('InvestCommon/features/wallet/DashboardWalletTopLeft.vue', async () => {
  const { defineComponent } = await import('vue');

  return {
    default: defineComponent({
      name: 'DashboardWalletTopLeft',
      template: '<div />',
    }),
  };
});

describe('ViewDashboard', () => {
  beforeEach(() => {
    routeState.path = '/profile/1031/distributions';
    routeState.query = {
      filter: 'open',
      tab: DashboardTabTypes.wallet,
    };
    selectedTab.value = DashboardTabTypes.wallet;
  });

  it('keeps dashboard tab links on the current path and drives the active tab from the query value', () => {
    const wrapper = mount(ViewDashboard, {
      props: {
        tab: DashboardTabTypes.distributions,
      },
    });

    const pageTopInfoAndTabs = wrapper.getComponent({ name: 'VPageTopInfoAndTabs' });
    const tabs = pageTopInfoAndTabs.props('tabs') as Record<string, {
      to: { path: string; query: Record<string, string> };
    }>;

    expect(pageTopInfoAndTabs.props('tab')).toBe(DashboardTabTypes.wallet);
    expect(tabs.wallet.to).toEqual({
      path: '/profile/1031/distributions',
      query: {
        filter: 'open',
        tab: DashboardTabTypes.wallet,
      },
    });
    expect(tabs.distributions.to).toEqual({
      path: '/profile/1031/distributions',
      query: {
        filter: 'open',
      },
    });
  });
});
