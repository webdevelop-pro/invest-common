import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
vi.mock('UiKit/components/VAvatar.vue', () => ({
  default: {
    template: '<div data-testid="avatar" />',
  },
}));

const userSessionTraits = ref({ email: 'user@example.com' });
const getUserState = ref({ data: { id: 123, image_link_id: 55 } });
const selectedUserProfileId = ref(872);
const postSignurlState = ref({ data: { meta: { id: 999 } } });
const isDialogLogoutOpen = ref(false);

const uploadHandler = vi.fn(async () => true);
const updateUserData = vi.fn(async () => true);
const getUser = vi.fn(async () => true);

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('getUserState' in store) return { getUserState };
      if ('userSessionTraits' in store) return { userSessionTraits };
      if ('selectedUserProfileId' in store) return { selectedUserProfileId };
      if ('postSignurlState' in store) return { postSignurlState };
      if ('isDialogLogoutOpen' in store) return { isDialogLogoutOpen };
      return {};
    },
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSessionTraits,
  }),
}));
vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: () => ({
    isDialogLogoutOpen,
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState,
    updateUserData,
    getUser,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
  }),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: () => ({
    postSignurlState,
    uploadHandler,
  }),
}));
vi.mock('InvestCommon/domain/config/links', async () => {
  const actual = await vi.importActual<typeof import('InvestCommon/domain/config/links')>(
    'InvestCommon/domain/config/links',
  );
  return {
    ...actual,
    urlProfilePortfolio: (id: string | number) => `/profile/${id}/portfolio`,
    urlFaq: '/faq',
    urlContactUs: '/contact-us',
    urlSettingsAccountDetails: (id: string | number) => `/settings/${id}/account-details`,
    urlSettingsMfa: (id: string | number) => `/settings/${id}/mfa`,
    urlSettingsSecurity: (id: string | number) => `/settings/${id}/account-security`,
  };
});

describe('VHeaderProfilePWA', () => {
  beforeEach(() => {
    userSessionTraits.value = { email: 'user@example.com' };
    getUserState.value = { data: { id: 123, image_link_id: 55 } };
    selectedUserProfileId.value = 872;
    postSignurlState.value = { data: { meta: { id: 999 } } };
    uploadHandler.mockClear();
    updateUserData.mockClear();
    getUser.mockClear();
  });

  it('renders avatar and email', async () => {
    const { default: VHeaderProfilePWA } = await import('../VHeaderProfilePWA.vue');
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VAvatar: {
            template: '<div data-testid="avatar" />',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('user@example.com');
  });

  it('clicking avatar triggers file input click', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    const { default: VHeaderProfilePWA } = await import('../VHeaderProfilePWA.vue');
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VAvatar: true,
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('uploads and updates avatar on file change', async () => {
    const { default: VHeaderProfilePWA } = await import('../VHeaderProfilePWA.vue');
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VAvatar: true,
        },
      },
    });

    const input = wrapper.find('input[type="file"]');
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');

    expect(uploadHandler).toHaveBeenCalledWith(file, 123, 'user', 123);
    expect(updateUserData).toHaveBeenCalledWith(123, { image_link_id: 999 });
    expect(getUser).toHaveBeenCalled();
  });

  it('opens profile overlay on email click', async () => {
    const { default: VHeaderProfilePWA } = await import('../VHeaderProfilePWA.vue');
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VAvatar: true,
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <div class="v-header-profile-pwa__overlay-email">{{ email }}</div>
                <a class="v-header-profile-pwa__overlay-link">Account Details</a>
              </div>
            `,
            props: ['email'],
          },
        },
      },
    });

    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(false);
    await wrapper.find('.v-header-profile-pwa__email').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(true);
    expect(wrapper.find('.v-header-profile-pwa__overlay-email').text()).toContain('user@example.com');
    expect(wrapper.find('.v-header-profile-pwa__overlay-link').text()).toBe('Account Details');
  });

  it('opens logout dialog from overlay', async () => {
    const { default: VHeaderProfilePWA } = await import('../VHeaderProfilePWA.vue');
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VAvatar: true,
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <button class="v-header-profile-pwa__overlay-logout" @click="$emit('logout')">
                  Log Out
                </button>
              </div>
            `,
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__email').trigger('click');
    await wrapper.find('.v-header-profile-pwa__overlay-logout').trigger('click');
    expect(isDialogLogoutOpen.value).toBe(true);
  });
});
