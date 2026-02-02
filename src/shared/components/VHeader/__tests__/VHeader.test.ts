import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import VHeader from '../VHeader.vue';

const userLoggedIn = ref(false);
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
      return { userLoggedIn };
    },
  };
});
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState: userState.value,
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
vi.mock('UiKit/components/VHeader/VHeader.vue', () => ({
  default: {
    template: '<div><slot /><slot name="mobile" /><slot name="leading" /><slot name="logo" /><slot name="pwa" /></div>',
  },
}));

const mountHeader = (layout = '') => mount(VHeader, {
  props: {
    layout,
    path: '/any',
    showProfileLink: true,
  },
  global: {
    stubs: {
      VSkeleton: true,
      VButton: {
        template: '<button><slot /></button>',
      },
      VHeaderProfile: {
        template: '<div data-testid="profile-menu" />',
      },
      VHeaderProfileMobile: true,
      VHeader: {
        template: '<div><slot /><slot name="mobile" /></div>',
      },
    },
  },
});

describe('VHeader (web)', () => {
  beforeEach(() => {
    userLoggedIn.value = false;
    userState.value = { loading: false };
  });

  it('shows both auth buttons on a regular page', () => {
    const wrapper = mountHeader('');
    expect(wrapper.text()).toContain('Log In');
    expect(wrapper.text()).toContain('Sign Up');
    expect(wrapper.find('.v-header-invest__pwa-back').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-login').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-logout').exists()).toBe(false);
    expect(wrapper.find('.v-header-invest__pwa-auth').exists()).toBe(false);
  });

  it('shows only Sign Up on sign-in page', () => {
    const wrapper = mountHeader('auth-login');
    expect(wrapper.text()).not.toContain('Log In');
    expect(wrapper.text()).toContain('Sign Up');
    expect(wrapper.find('.v-header-invest__pwa-auth').exists()).toBe(false);
  });

  it('shows only Log In on sign-up page', () => {
    const wrapper = mountHeader('auth-signup');
    expect(wrapper.text()).toContain('Log In');
    expect(wrapper.text()).not.toContain('Sign Up');
    expect(wrapper.find('.v-header-invest__pwa-auth').exists()).toBe(false);
  });

  it('shows profile menu when logged in', () => {
    userLoggedIn.value = true;
    const wrapper = mountHeader('');
    expect(wrapper.find('[data-testid="profile-menu"]').exists()).toBe(true);
    expect(wrapper.find('.v-header-invest__pwa-logout').exists()).toBe(false);
  });
});
