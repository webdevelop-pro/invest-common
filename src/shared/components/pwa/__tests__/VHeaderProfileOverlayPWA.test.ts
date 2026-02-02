import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VHeaderProfileOverlayPWA from '../VHeaderProfileOverlayPWA.vue';

vi.mock('UiKit/components/VAvatar.vue', () => ({
  default: { template: '<div data-testid="avatar" />' },
}));
vi.mock('UiKit/assets/images/arrow-right.svg', () => ({
  default: { template: '<i data-testid="chevron" />' },
}));
vi.mock('UiKit/assets/images/menu_common/user.svg', () => ({
  default: { template: '<i data-testid="icon-user" />' },
}));
vi.mock('UiKit/assets/images/menu_common/gear.svg', () => ({
  default: { template: '<i data-testid="icon-gear" />' },
}));
vi.mock('UiKit/assets/images/menu_common/help.svg', () => ({
  default: { template: '<i data-testid="icon-help" />' },
}));
vi.mock('UiKit/assets/images/menu_common/faq.svg', () => ({
  default: { template: '<i data-testid="icon-faq" />' },
}));
vi.mock('UiKit/assets/images/menu_common/logout.svg', () => ({
  default: { template: '<i data-testid="icon-logout" />' },
}));

const mountOverlay = (props: Record<string, unknown> = {}) => mount(VHeaderProfileOverlayPWA, {
  props: {
    email: 'maria@webdevelop.pro',
    avatarSrc: '/avatar.png',
    accountDetailsHref: '/settings/1/account-details',
    mfaHref: '/settings/1/mfa',
    securityHref: '/settings/1/security',
    helpHref: '/faq',
    contactHref: '/contact-us',
    ...props,
  },
  global: {
    stubs: {
      Teleport: true,
    },
  },
});

describe('VHeaderProfileOverlayPWA', () => {
  it('renders email and account details link', () => {
    const wrapper = mountOverlay();
    expect(wrapper.find('.v-header-profile-pwa__overlay-email').text()).toBe('maria@webdevelop.pro');
    expect(wrapper.find('.v-header-profile-pwa__overlay-link').text()).toBe('Account Details');
  });

  it('emits close on close button click', async () => {
    const wrapper = mountOverlay();
    await wrapper.find('.v-header-profile-pwa__overlay-close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits logout on logout button click', async () => {
    const wrapper = mountOverlay();
    await wrapper.find('.v-header-profile-pwa__overlay-item--logout').trigger('click');
    expect(wrapper.emitted('logout')).toBeTruthy();
  });

  it('hides optional links when hrefs are missing', () => {
    const wrapper = mountOverlay({
      accountDetailsHref: '',
      mfaHref: '',
      securityHref: '',
      helpHref: '',
      contactHref: '',
    });
    expect(wrapper.find('.v-header-profile-pwa__overlay-link').exists()).toBe(false);
    const items = wrapper.findAll('.v-header-profile-pwa__overlay-item');
    expect(items).toHaveLength(1);
    expect(items[0]?.text()).toContain('Log Out');
  });
});
