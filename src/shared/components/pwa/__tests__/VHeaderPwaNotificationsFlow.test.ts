import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  defineComponent, h, nextTick, ref,
} from 'vue';

const userLoggedIn = ref(true);
const selectedUserProfileId = ref(10);
const userState = ref({ loading: false });
const notificationUnreadLength = ref(2);
const isSidebarOpen = ref(false);

const hoisted = vi.hoisted(() => ({
  mockIcon: (name: string) =>
    defineComponent({ name, setup: () => () => h('i', { 'data-icon': name }) }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
  }),
}));
vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if (!store) return {};
      if ('getUserState' in store) return { getUserState: userState };
      if ('selectedUserProfileId' in store) return { selectedUserProfileId };
      if ('userLoggedIn' in store) return { userLoggedIn };
      const refs: Record<string, any> = {};
      for (const key in store) {
        const value = (store as any)[key];
        if (value && typeof value === 'object' && 'value' in value) {
          refs[key] = value;
        } else if (value !== null && value !== undefined) {
          refs[key] = { value };
        }
      }
      return refs;
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
vi.mock('InvestCommon/features/notifications/store/useNotifications', () => ({
  useNotifications: () => ({
    notificationUnreadLength,
    isSidebarOpen,
    onSidebarToggle: (value: boolean) => {
      isSidebarOpen.value = value;
    },
    loadData: vi.fn(),
  }),
}));
vi.mock('InvestCommon/features/notifications/VNotificationsSidebarButton.vue', () => ({
  default: defineComponent({
    name: 'VNotificationsSidebarButton',
    props: {
      showIcon: { type: Boolean, default: false },
    },
    setup(props) {
      const onClick = () => {
        isSidebarOpen.value = true;
      };
      return () => h(
        'div',
        {
          class: 'notifications-sidebar-button',
          role: 'button',
          onClick,
        },
        [
          props.showIcon
            ? h('i', { class: 'notifications-sidebar-button__notification-icon' })
            : null,
          h('span', { class: 'notifications-sidebar-button__badge' }, String(notificationUnreadLength.value)),
        ],
      );
    },
  }),
}));
vi.mock('UiKit/assets/images/message.svg', () => ({ default: hoisted.mockIcon('MessageIcon') }));
vi.mock('UiKit/components/VAvatar.vue', () => ({
  default: defineComponent({ name: 'VAvatar', template: '<div data-testid="avatar" />' }),
}));
vi.mock('UiKit/components/Base/VButton/VButton.vue', () => ({
  default: defineComponent({ name: 'VButton', template: '<button><slot /></button>' }),
}));
vi.mock('UiKit/components/Base/VNavigationMenu', () => ({
  VNavigationMenuLink: defineComponent({
    name: 'VNavigationMenuLink',
    props: { href: { type: String, required: true } },
    setup(props, { slots, attrs }) {
      return () => h('a', { href: props.href, ...attrs }, slots.default?.());
    },
  }),
}));
vi.mock('UiKit/components/VHeader/VHeader.vue', () => ({
  default: {
    template: '<div><slot name="leading" /><slot name="logo" /><slot /><slot name="pwa" /><slot name="mobile" /></div>',
  },
}));
vi.mock('../VHeader/VHeaderProfilePWA.vue', () => ({
  __esModule: true,
  name: 'VHeaderProfilePWA',
  default: defineComponent({ name: 'VHeaderProfilePWA', template: '<div />' }),
}));
vi.mock('../VHeader/VHeaderProfileMobile.vue', () => ({
  __esModule: true,
  name: 'VHeaderProfileMobile',
  default: defineComponent({ name: 'VHeaderProfileMobile', template: '<div />' }),
}));

describe('PWA notifications flow', () => {
  beforeEach(() => {
    userLoggedIn.value = true;
    selectedUserProfileId.value = 10;
    userState.value = { loading: false };
    notificationUnreadLength.value = 2;
    isSidebarOpen.value = false;
  });

  it('renders notifications icon and unread badge in PWA header', async () => {
    const { default: VHeaderPWA } = await import('../VHeaderPWA.vue');
    const wrapper = mount(VHeaderPWA, {
      props: {
        layout: '',
        path: '/offers',
        showProfileLink: false,
      },
      global: {
        stubs: {
          VHeaderProfilePWA: true,
          VHeaderProfileMobile: true,
          VButton: true,
          VSkeleton: true,
          VLogo: true,
        },
      },
    });

    expect(wrapper.find('.notifications-sidebar-button__notification-icon').exists()).toBe(true);
    expect(wrapper.find('.notifications-sidebar-button__badge').exists()).toBe(true);
  });

  it('shows unread badge with single digit count', async () => {
    notificationUnreadLength.value = 5;
    const { default: VHeaderPWA } = await import('../VHeaderPWA.vue');
    const wrapper = mount(VHeaderPWA, {
      props: {
        layout: '',
        path: '/offers',
        showProfileLink: false,
      },
      global: {
        stubs: {
          VHeaderProfilePWA: true,
          VHeaderProfileMobile: true,
          VButton: true,
          VSkeleton: true,
          VLogo: true,
        },
      },
    });

    expect(wrapper.find('.notifications-sidebar-button__badge').text()).toBe('5');
  });

  it('shows unread badge with two digit count', async () => {
    notificationUnreadLength.value = 12;
    const { default: VHeaderPWA } = await import('../VHeaderPWA.vue');
    const wrapper = mount(VHeaderPWA, {
      props: {
        layout: '',
        path: '/offers',
        showProfileLink: false,
      },
      global: {
        stubs: {
          VHeaderProfilePWA: true,
          VHeaderProfileMobile: true,
          VButton: true,
          VSkeleton: true,
          VLogo: true,
        },
      },
    });

    expect(wrapper.find('.notifications-sidebar-button__badge').text()).toBe('12');
  });

  it('hides PWA footer after opening notifications sidebar', async () => {
    const { default: VHeaderPWA } = await import('../VHeaderPWA.vue');
    const { default: PWAFooterMenu } = await import('../PWAFooterMenu.vue');

    const Shell = defineComponent({
      components: { VHeaderPWA, PWAFooterMenu },
      template: `
        <div>
          <VHeaderPWA layout="" path="/offers" />
          <PWAFooterMenu current-path="/offers" />
        </div>
      `,
    });

    const wrapper = mount(Shell, {
      global: {
        stubs: {
          VHeaderProfilePWA: true,
          VHeaderProfileMobile: true,
          VButton: true,
          VSkeleton: true,
          VLogo: true,
        },
      },
    });

    expect(wrapper.find('nav[aria-label="PWA Bottom Menu"]').exists()).toBe(true);
    await wrapper.find('.notifications-sidebar-button').trigger('click');
    await nextTick();
    expect(wrapper.find('nav[aria-label="PWA Bottom Menu"]').exists()).toBe(false);
  });
});
