import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import {
  urlHome,
  urlProfilePortfolio,
} from 'InvestCommon/domain/config/links';

const userLoggedIn = ref(false);
const selectedUserProfileId = ref(0);
const userState = ref({ loading: false });

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({}),
}));
vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('getUserState' in store) {
        return { getUserState: userState };
      }
      if ('isDialogLogoutOpen' in store) {
        return { isDialogLogoutOpen: (store as { isDialogLogoutOpen: typeof userLoggedIn }).isDialogLogoutOpen };
      }
      if ('selectedUserProfileId' in store) {
        return { selectedUserProfileId };
      }
      return { userLoggedIn };
    },
  };
});
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState: userState.value,
  }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
  }),
}));
vi.mock('UiKit/composables/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isDesktopMD: ref(true),
  }),
}));
vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({}),
}), { virtual: true });
vi.mock('UiKit/components/VHeader/VHeader.vue', () => ({
  default: {
    template: '<div><slot name="leading" /><slot name="logo" /><slot /><slot name="pwa" /><slot name="mobile" /></div>',
  },
}));

const mountHeader = async (layout = '', path = '/some') => {
  const { default: VHeaderPWA } = await import('../VHeaderPWA.vue');
  return mount(VHeaderPWA, {
    props: {
      layout,
      path,
      showProfileLink: false,
  },
  global: {
    stubs: {
      VSkeleton: true,
      VButton: {
        template: '<button><slot /></button>',
      },
      VLogo: true,
      VHeaderProfilePWA: {
        template: '<div data-testid="profile-menu" />',
      },
      VHeaderProfileMobile: {
        template: '<div data-testid="profile-menu-mobile" />',
      },
      NotificationsSidebarButton: {
        template: '<div class="notifications-sidebar-button" />',
      },
      VHeader: {
        template: '<div><slot name="leading" /><slot name="logo" /><slot /><slot name="pwa" /><slot name="mobile" /></div>',
      },
    },
  },
  });
};

describe('VHeaderPWA', () => {
  beforeEach(() => {
    userLoggedIn.value = false;
    selectedUserProfileId.value = 0;
    userState.value = { loading: false };
    window.history.pushState({}, '', '/');
  });

  it('hides back button on root path', async () => {
    const wrapper = await mountHeader('', urlHome);
    expect(wrapper.find('.v-header-invest__pwa-back').exists()).toBe(false);
  });

  it('shows back button on non-root path', async () => {
    const wrapper = await mountHeader('', '/some/other');
    expect(wrapper.find('.v-header-invest__pwa-back').exists()).toBe(true);
  });

  it('shows login link when logged out on non-auth page', async () => {
    const wrapper = await mountHeader('', '/offers');
    expect(wrapper.text()).toContain('Log in');
  });

  it('shows notifications icon when logged in', async () => {
    userLoggedIn.value = true;
    const wrapper = await mountHeader('', '/offers');
    expect(wrapper.find('.v-header-invest__pwa-notifications').exists()).toBe(true);
  });

  it('shows notifications icon on auth pages for logged in users', async () => {
    userLoggedIn.value = true;
    const wrapper = await mountHeader('auth-login', '/signin');
    expect(wrapper.find('.v-header-invest__pwa-notifications').exists()).toBe(true);
  });

  it('hides notifications icon on kyc-bo pages', async () => {
    userLoggedIn.value = true;
    const wrapper = await mountHeader('kyc-bo', '/kyc-bo');
    expect(wrapper.find('.v-header-invest__pwa-notifications').exists()).toBe(false);
  });

  it('shows Sign Up CTA on sign-in page', async () => {
    const wrapper = await mountHeader('auth-login', '/signin');
    expect(wrapper.text()).toContain('Sign Up');
  });

  it('shows Log In CTA on sign-up page', async () => {
    const wrapper = await mountHeader('auth-signup', '/signup');
    expect(wrapper.text()).toContain('Log In');
  });

  it('shows profile menu when logged in', async () => {
    userLoggedIn.value = true;
    selectedUserProfileId.value = 10;
    const wrapper = await mountHeader('', urlProfilePortfolio(10));
    expect(wrapper.find('[data-testid="profile-menu"]').exists()).toBe(true);
  });

  it('shows only back button on offer details page', async () => {
    userLoggedIn.value = true;
    const wrapper = await mountHeader('offer-single', '/offers/some-offer');
    expect(wrapper.find('[data-testid="profile-menu"]').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-notifications').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-logo').exists()).toBe(false);
    expect(wrapper.find('.v-header__logo').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-login').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-auth').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-logout').exists()).toBe(false);
  });
});
