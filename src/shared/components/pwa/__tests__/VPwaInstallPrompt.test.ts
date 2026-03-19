import {
  describe,
  expect,
  it,
} from 'vitest';
import { mount } from '@vue/test-utils';
import VPwaInstallPrompt from '../VPwaInstallPrompt.vue';

const mountPrompt = (props: Record<string, unknown>) => mount(VPwaInstallPrompt, {
  props,
  global: {
    stubs: {
      VAlert: {
        template: '<section data-testid="alert"><slot name="title" /><slot name="description" /><slot /></section>',
      },
      VButton: {
        props: ['loading', 'disabled', 'variant', 'color', 'size'],
        template: '<button :disabled="disabled" :data-variant="variant" :data-color="color" :data-loading="loading"><slot /></button>',
      },
    },
  },
});

describe('VPwaInstallPrompt', () => {
  it('hides itself when install state is hidden', () => {
    const wrapper = mountPrompt({
      canInstall: false,
      installState: 'hidden',
    });

    expect(wrapper.find('[data-testid="pwa-install-prompt"]').exists()).toBe(false);
  });

  it('renders the native install CTA and emits public events', async () => {
    const wrapper = mountPrompt({
      canInstall: true,
      installState: 'native',
    });

    expect(wrapper.text()).toContain('Install app');
    expect(wrapper.text()).toContain('Install Invest PRO');

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toContain('Install');
    expect(buttons[1].text()).toContain('Not now');
    expect(buttons[1].attributes('data-variant')).toBe('outlined');

    await buttons[0].trigger('click');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('install')).toHaveLength(1);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('renders manual iOS guidance when native install is unavailable', async () => {
    const wrapper = mountPrompt({
      canInstall: false,
      installState: 'manual-ios',
    });

    expect(wrapper.text()).toContain('Add to Home Screen');
    expect(wrapper.text()).toContain('Share menu in Safari');

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text()).toContain('Got it');
    expect(buttons[0].attributes('data-color')).toBe('secondary');

    await buttons[0].trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});
