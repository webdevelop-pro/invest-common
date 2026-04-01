import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, ref } from 'vue';
import {
  ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_SUMMARY,
} from 'InvestCommon/domain/config/enums/routes';
import DashboardTopInfo from '../DashboardTopInfo.vue';

const userSessionTraits = ref({ first_name: 'Maria' });
const getUserState = ref({ loading: false });
const getProfileByIdState = ref({ loading: false });
const selectedUserProfileId = ref(872);
const isTablet = ref(true);
const usesMobileAppShell = ref(true);
const routeState = reactive({
  name: ROUTE_DASHBOARD_SUMMARY,
  query: {} as Record<string, string>,
});

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('userSessionTraits' in store) {
        return { userSessionTraits };
      }
      if ('getUserState' in store && 'getProfileByIdState' in store) {
        return { getUserState, getProfileByIdState };
      }
      if ('selectedUserProfileId' in store) {
        return { selectedUserProfileId };
      }
      return {};
    },
  };
});

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSessionTraits,
  }),
}));

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: () => ({
    getSessionState: { loading: false },
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState,
    getProfileByIdState,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
  }),
}));

vi.mock('UiKit/composables/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTablet,
  }),
}));

vi.mock('InvestCommon/domain/mobile/useMobileAppShell', () => ({
  useMobileAppShell: () => ({
    usesMobileAppShell,
  }),
}));

const mountComponent = () => mount(DashboardTopInfo, {
  global: {
    stubs: {
      VSkeleton: true,
      VProfileSelectList: {
        template: '<div data-testid="profile-select" />',
      },
      VKycButton: true,
      VAccreditationButton: true,
      DashboardTopInfoRight: true,
      RouterLink: {
        props: ['to'],
        template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
      },
    },
  },
});

describe('DashboardTopInfo', () => {
  beforeEach(() => {
    userSessionTraits.value = { first_name: 'Maria' };
    getUserState.value = { loading: false };
    getProfileByIdState.value = { loading: false };
    selectedUserProfileId.value = 872;
    isTablet.value = true;
    usesMobileAppShell.value = true;
    routeState.name = ROUTE_DASHBOARD_SUMMARY;
    routeState.query = {};
  });

  it('shows profile details link on tablet mobile shell away from profile details page', () => {
    const wrapper = mountComponent();

    const link = wrapper.find('.dashboard-top-info__profile-details-link');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('Profile Details');
  });

  it('hides profile details link on account route without tab', () => {
    routeState.name = ROUTE_DASHBOARD_ACCOUNT;

    const wrapper = mountComponent();
    expect(wrapper.find('.dashboard-top-info__profile-details-link').exists()).toBe(false);
  });

  it('hides profile details link on account route when tab=account', () => {
    routeState.name = ROUTE_DASHBOARD_ACCOUNT;
    routeState.query = { tab: 'account' };

    const wrapper = mountComponent();
    expect(wrapper.find('.dashboard-top-info__profile-details-link').exists()).toBe(false);
  });

  it('keeps profile details link visible on other account tabs', () => {
    routeState.name = ROUTE_DASHBOARD_ACCOUNT;
    routeState.query = { tab: 'portfolio' };

    const wrapper = mountComponent();
    expect(wrapper.find('.dashboard-top-info__profile-details-link').exists()).toBe(true);
  });

  it('hides profile details link when the query selects the account tab on another dashboard route', () => {
    routeState.name = ROUTE_DASHBOARD_SUMMARY;
    routeState.query = { tab: 'acount' };

    const wrapper = mountComponent();
    expect(wrapper.find('.dashboard-top-info__profile-details-link').exists()).toBe(false);
  });
});
