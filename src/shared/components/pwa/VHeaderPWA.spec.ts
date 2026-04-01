/* @vitest-environment jsdom */
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
  defineComponent,
  h,
  ref,
} from 'vue';

const hoisted = vi.hoisted(() => ({
  navigateWithQueryParams: vi.fn(),
}));

const userLoggedIn = ref(true);
const getUserState = ref({ loading: false });
const selectedUserProfileId = ref(1031);
vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
  }),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: hoisted.navigateWithQueryParams,
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    IS_STATIC_SITE: false,
  },
}));

vi.mock('InvestCommon/domain/config/links', () => ({
  urlFaq: '/faq',
  urlHome: '/',
  urlHowItWorks: '/how-it-works',
  urlNotifications: '/notifications',
  urlOffers: '/offers',
  urlProfileAccount: (profileId: number) => `/profile/${profileId}/account`,
  urlProfileCryptoWallet: (profileId: number) => `/profile/${profileId}/crypto-wallet`,
  urlProfileEarn: (profileId: number) => `/profile/${profileId}/earn`,
  urlProfilePortfolio: (profileId: number) => `/profile/${profileId}/portfolio`,
  urlProfileSummary: (profileId: number) => `/profile/${profileId}/summary`,
  urlProfileWallet: (profileId: number) => `/profile/${profileId}/wallet`,
  urlSignin: '/signin',
  urlSignup: '/signup',
}));

vi.mock('UiKit/components/VHeader/VHeaderAuthorized.vue', () => ({
  default: defineComponent({
    name: 'VHeaderAuthorized',
    props: {
      showMobileSidebar: { type: Boolean, default: true },
    },
    setup(props, { slots }) {
      return () => h(
        'div',
        {
          'data-testid': 'authorized-header',
          'data-show-mobile-sidebar': String(props.showMobileSidebar),
        },
        [
          slots.leading?.(),
          slots.logo?.(),
          slots.default?.(),
          slots.pwa?.(),
          slots.mobile?.(),
        ],
      );
    },
  }),
}));

vi.mock('UiKit/components/VHeader/VHeaderGuest.vue', () => ({
  default: defineComponent({
    name: 'VHeaderGuest',
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'guest-header' }, [
        slots.leading?.(),
        slots.logo?.(),
        slots.default?.(),
        slots.pwa?.(),
        slots.mobile?.(),
      ]);
    },
  }),
}));

vi.mock('UiKit/components/Base/VSkeleton/VSkeleton.vue', () => ({
  default: defineComponent({
    name: 'VSkeleton',
    template: '<div data-testid="skeleton" />',
  }),
}));

vi.mock('UiKit/components/VLogo.vue', () => ({
  default: defineComponent({
    name: 'VLogo',
    template: '<a data-testid="logo" />',
  }),
}));

vi.mock('UiKit/components/Base/VButton/VButton.vue', () => ({
  default: defineComponent({
    name: 'VButton',
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  }),
}));

vi.mock('UiKit/components/Base/VSidebar', () => ({
  VSidebarTrigger: defineComponent({
    name: 'VSidebarTrigger',
    template: '<button data-testid="sidebar-trigger" type="button"><slot /></button>',
  }),
}));

vi.mock('InvestCommon/features/notifications/VNotificationsSidebarButton.vue', () => ({
  default: defineComponent({
    name: 'NotificationsSidebarButton',
    template: '<button data-testid="notifications-button" type="button">notifications</button>',
  }),
}));

vi.mock('UiKit/assets/images/arrow-left.svg', () => ({
  default: defineComponent({
    name: 'ArrowLeftIcon',
    template: '<svg data-testid="back-icon" />',
  }),
}));

vi.mock('InvestCommon/shared/assets/images/icons/pwa-login-arrow.svg', () => ({
  default: defineComponent({
    name: 'PwaLoginArrowIcon',
    template: '<svg data-testid="login-arrow" />',
  }),
}));

vi.mock('../VHeader/VHeaderProfilePWA.vue', () => ({
  __esModule: true,
  __isTeleport: false,
  default: defineComponent({
    name: 'VHeaderProfilePWA',
    template: '<div data-testid="profile-pwa" />',
  }),
}));

vi.mock('../VHeader/VHeaderProfileMobile.vue', () => ({
  __esModule: true,
  __isTeleport: false,
  default: defineComponent({
    name: 'VHeaderProfileMobile',
    template: '<div data-testid="profile-mobile" />',
  }),
}));

import VHeaderPWA from './VHeaderPWA.vue';

async function mountHeader(props: Record<string, unknown> = {}) {
  const wrapper = mount(VHeaderPWA, {
    props: {
      path: '/profile/1031/portfolio',
      profileMenu: [{ text: 'Dashboard' }],
      ...props,
    },
  });

  await vi.dynamicImportSettled();

  return wrapper;
}

describe('VHeaderPWA', () => {
  beforeEach(() => {
    userLoggedIn.value = true;
    getUserState.value = { loading: false };
    selectedUserProfileId.value = 1031;
    hoisted.navigateWithQueryParams.mockReset();
  });

  it('disables the mobile menu and shows the sidebar trigger when requested', async () => {
    const wrapper = await mountHeader({ showSidebarTrigger: true });
    const headerChildren = Array.from(
      wrapper.get('[data-testid="authorized-header"]').element.children,
    ).map((element) => element.getAttribute('data-testid'));

    expect(wrapper.get('[data-testid="authorized-header"]').attributes('data-show-mobile-sidebar')).toBe('false');
    expect(wrapper.find('[data-testid="notifications-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="sidebar-trigger"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="sidebar-trigger"] [data-testid="profile-pwa"]').exists()).toBe(true);
    expect(headerChildren[0]).toBe('sidebar-trigger');
  });

  it('keeps the default mobile menu behavior when the sidebar trigger is not requested', async () => {
    const wrapper = await mountHeader();

    expect(wrapper.get('[data-testid="authorized-header"]').attributes('data-show-mobile-sidebar')).toBe('true');
    expect(wrapper.find('[data-testid="sidebar-trigger"]').exists()).toBe(false);
  });
});
