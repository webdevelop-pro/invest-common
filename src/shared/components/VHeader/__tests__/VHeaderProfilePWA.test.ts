import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import VHeaderProfilePWA from '../VHeaderProfilePWA.vue';

vi.mock('UiKit/components/VAvatar.vue', () => ({
  default: defineComponent({
    name: 'VAvatar',
    props: {
      loading: {
        type: Boolean,
        default: false,
      },
    },
    template: '<div data-testid="avatar" :data-loading="String(loading)" />',
  }),
}));

const userSessionTraits = ref({ email: 'user@example.com' });
const getUserState = ref({ data: { id: 123, image_link_id: 55 } });
const selectedUserProfileId = ref(872);
const notificationFieldsState = ref({ data: undefined as Record<string, unknown> | undefined });
const postSignurlState = ref({ data: { meta: { id: 999 } } });
const isDialogLogoutOpen = ref(false);

const uploadHandler = vi.fn(async () => true);
const updateUserData = vi.fn(async () => true);
const getUser = vi.fn(async () => true);

const createDeferred = () => {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
};

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('getUserState' in store) return { getUserState };
      if ('userSessionTraits' in store) return { userSessionTraits };
      if ('selectedUserProfileId' in store) return { selectedUserProfileId };
      if ('postSignurlState' in store) return { notificationFieldsState, postSignurlState };
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
    notificationFieldsState,
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
    urlHowItWorks: '/how-it-works',
    urlContactUs: '/contact-us',
    urlSettingsAccountDetails: (id: string | number) => `/settings/${id}/account-details`,
    urlSettingsMfa: (id: string | number) => `/settings/${id}/mfa`,
    urlSettingsSecurity: (id: string | number) => `/settings/${id}/security`,
  };
});

describe('VHeaderProfilePWA', () => {
  beforeEach(() => {
    userSessionTraits.value = { email: 'user@example.com' };
    getUserState.value = { data: { id: 123, image_link_id: 55 } };
    selectedUserProfileId.value = 872;
    notificationFieldsState.value = { data: undefined };
    postSignurlState.value = { data: { meta: { id: 999 } } };
    uploadHandler.mockClear();
    updateUserData.mockClear();
    getUser.mockClear();
  });

  it('renders avatar and email', async () => {
    const wrapper = mount(VHeaderProfilePWA);

    expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="avatar"]').attributes('data-loading')).toBe('false');
    expect(wrapper.text()).toContain('user@example.com');
  });

  it('clicking avatar triggers file input click', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    const wrapper = mount(VHeaderProfilePWA);

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('shows header avatar loading during upload and resets afterward', async () => {
    const deferredUpload = createDeferred();
    uploadHandler.mockImplementationOnce(() => deferredUpload.promise);

    const wrapper = mount(VHeaderProfilePWA);

    const input = wrapper.find('input[type="file"]');
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    expect(wrapper.find('[data-testid="avatar"]').attributes('data-loading')).toBe('true');

    deferredUpload.resolve(true);
    await flushPromises();

    expect(uploadHandler).toHaveBeenCalledWith(file, 123, 'user', 123);
    expect(updateUserData).toHaveBeenCalledWith({ image_link_id: 999 });
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="avatar"]').attributes('data-loading')).toBe('true');

    notificationFieldsState.value = {
      data: {
        object_id: 700174,
        type: 'file_thumbnail',
      },
    };
    await flushPromises();

    expect(getUser).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-testid="avatar"]').attributes('data-loading')).toBe('false');
  });

  it('forwards avatar loading state to the overlay', async () => {
    const deferredUpload = createDeferred();
    uploadHandler.mockImplementationOnce(() => deferredUpload.promise);

    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileOverlayPWA: defineComponent({
            name: 'VHeaderProfileOverlayPWA',
            props: {
              avatarLoading: {
                type: Boolean,
                default: false,
              },
            },
            template: '<div class="v-header-profile-pwa__overlay" :data-avatar-loading="String(avatarLoading)" />',
          }),
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__email').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-loading')).toBe('false');

    const input = wrapper.find('input[type="file"]');
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-loading')).toBe('true');

    deferredUpload.resolve(true);
    await flushPromises();

    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-loading')).toBe('true');

    notificationFieldsState.value = {
      data: {
        object_id: 700174,
        type: 'file_thumbnail',
      },
    };
    await flushPromises();

    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-loading')).toBe('false');
  });

  it('opens profile overlay on email click', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
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
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
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
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(false);
  });

  it('adds fromUserMenu marker to overlay navigation links', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileOverlayPWA: {
            template: `
              <div
                class="v-header-profile-pwa__overlay"
                :data-account="accountDetailsHref"
                :data-mfa="mfaHref"
                :data-security="securityHref"
                :data-how-it-works="howItWorksHref"
                :data-contact="contactHref"
              />
            `,
            props: ['accountDetailsHref', 'mfaHref', 'securityHref', 'howItWorksHref', 'contactHref'],
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__email').trigger('click');
    const overlay = wrapper.find('.v-header-profile-pwa__overlay');
    expect(overlay.attributes('data-account')).toContain('fromUserMenu=1');
    expect(overlay.attributes('data-mfa')).toContain('fromUserMenu=1');
    expect(overlay.attributes('data-security')).toContain('fromUserMenu=1');
    expect(overlay.attributes('data-how-it-works')).toContain('/how-it-works');
    expect(overlay.attributes('data-how-it-works')).toContain('fromUserMenu=1');
    expect(overlay.attributes('data-contact')).toContain('fromUserMenu=1');
    expect(overlay.attributes('data-contact')).toContain('/contact-us');
    expect(overlay.attributes('data-contact')).not.toContain('/faq');
  });
});
