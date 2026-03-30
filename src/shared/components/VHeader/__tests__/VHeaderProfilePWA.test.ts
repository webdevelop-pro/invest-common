import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
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
vi.mock('UiKit/components/VAvatarIdentity.vue', () => ({
  default: defineComponent({
    name: 'VAvatarIdentity',
    props: {
      label: {
        type: String,
        default: '',
      },
    },
    template: '<div class="v-header-profile-pwa__identity">{{ label }}</div>',
  }),
}));

const userSessionTraits = ref({ email: 'user@example.com' });
const getUserState = ref({ data: { id: 123, image_link_id: 55 } });
const selectedUserProfileId = ref(872);
const isDialogLogoutOpen = ref(false);
const selectedProfileLabel = ref('Growth SPV');

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('getUserState' in store) return { getUserState };
      if ('userSessionTraits' in store) return { userSessionTraits };
      if ('selectedUserProfileId' in store) return { selectedUserProfileId };
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
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
  }),
}));

vi.mock('InvestCommon/features/profiles/composables/useProfileSwitchMenu', () => ({
  useProfileSwitchMenu: () => ({
    selectedProfileLabel,
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
    selectedProfileLabel.value = 'Growth SPV';
    isDialogLogoutOpen.value = false;
  });

  it('renders avatar and selected profile identity', async () => {
    const wrapper = mount(VHeaderProfilePWA);

    expect(wrapper.find('.v-header-profile-pwa__avatar-btn').exists()).toBe(true);
    expect(wrapper.find('.v-header-profile-pwa__avatar-btn').attributes('aria-label')).toContain('Growth SPV');
    expect(wrapper.text()).toContain('Growth SPV');
  });

  it('keeps the overlay open when the avatar action is clicked', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <button class="v-header-profile-pwa__overlay-avatar-btn" @click="$emit('avatar-click')">
                  Upload avatar
                </button>
              </div>
            `,
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    await wrapper.find('.v-header-profile-pwa__overlay-avatar-btn').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(true);
  });

  it('forwards avatar source to the overlay', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileOverlayPWA: defineComponent({
            name: 'VHeaderProfileOverlayPWA',
            props: {
              avatarSrc: {
                type: String,
                default: '',
              },
            },
            template: '<div class="v-header-profile-pwa__overlay" :data-avatar-src="avatarSrc" />',
          }),
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-src')).toContain('/auth/files/55?size=small');
  });

  it('forwards the default avatar loading state to the overlay', async () => {
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

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').attributes('data-avatar-loading')).toBe('false');
  });

  it('opens profile overlay on profile identity click', async () => {
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
    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
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

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    await wrapper.find('.v-header-profile-pwa__overlay-logout').trigger('click');
    expect(isDialogLogoutOpen.value).toBe(true);
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(false);
  });

  it('closes overlay and opens profile switch sidebar from overlay trigger', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <button class="v-header-profile-pwa__overlay-switch" @click="$emit('switch-profile-open')">
                  Switch profile
                </button>
              </div>
            `,
          },
          VHeaderProfileSwitchSidebarPWA: {
            props: ['open'],
            template: '<div v-if="open" class="v-header-profile-pwa__switch-sidebar" />',
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(true);
    expect(wrapper.find('.v-header-profile-pwa__switch-sidebar').exists()).toBe(false);

    await wrapper.find('.v-header-profile-pwa__overlay-switch').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__overlay').exists()).toBe(false);
    expect(wrapper.find('.v-header-profile-pwa__switch-sidebar').exists()).toBe(true);
  });

  it('closes profile switch sidebar after selecting a profile', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      global: {
        stubs: {
          VHeaderProfileSwitchSidebarPWA: {
            props: ['open'],
            emits: ['select', 'update:open'],
            template: `
              <div
                v-if="open"
                class="v-header-profile-pwa__switch-sidebar"
              >
                <button class="v-header-profile-pwa__switch-sidebar-select" @click="$emit('select', '101')">
                  Select profile
                </button>
              </div>
            `,
          },
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <button class="v-header-profile-pwa__overlay-switch" @click="$emit('switch-profile-open')">
                  Switch profile
                </button>
              </div>
            `,
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    await wrapper.find('.v-header-profile-pwa__overlay-switch').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__switch-sidebar').exists()).toBe(true);

    await wrapper.find('.v-header-profile-pwa__switch-sidebar-select').trigger('click');
    expect(wrapper.find('.v-header-profile-pwa__switch-sidebar').exists()).toBe(false);
  });

  it('removes the body class when the profile switch sidebar closes itself', async () => {
    const wrapper = mount(VHeaderProfilePWA, {
      attachTo: document.body,
      global: {
        stubs: {
          VHeaderProfileSwitchSidebarPWA: {
            props: ['open'],
            emits: ['select', 'update:open'],
            template: `
              <div
                v-if="open"
                class="v-header-profile-pwa__switch-sidebar"
              >
                <button class="v-header-profile-pwa__switch-sidebar-close" @click="$emit('update:open', false)">
                  Close sidebar
                </button>
              </div>
            `,
          },
          VHeaderProfileOverlayPWA: {
            template: `
              <div class="v-header-profile-pwa__overlay">
                <button class="v-header-profile-pwa__overlay-switch" @click="$emit('switch-profile-open')">
                  Switch profile
                </button>
              </div>
            `,
          },
        },
      },
    });

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
    await wrapper.find('.v-header-profile-pwa__overlay-switch').trigger('click');
    expect(document.body.classList.contains('pwa-profile-switch-sidebar-open')).toBe(true);

    await wrapper.find('.v-header-profile-pwa__switch-sidebar-close').trigger('click');
    expect(document.body.classList.contains('pwa-profile-switch-sidebar-open')).toBe(false);

    wrapper.unmount();
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

    await wrapper.find('.v-header-profile-pwa__avatar-btn').trigger('click');
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
