import {
  describe,
  expect,
  it,
} from 'vitest';
import { mount } from '@vue/test-utils';
import VPwaUpdatePrompt from '../VPwaUpdatePrompt.vue';

const mountPrompt = (props: Record<string, unknown>) => mount(VPwaUpdatePrompt, {
  props,
  global: {
    stubs: {
      VAlert: {
        props: ['variant'],
        template: '<section data-testid="alert" :data-variant="variant"><slot name="title" /><slot name="description" /><slot /></section>',
      },
      VButton: {
        props: ['loading', 'disabled', 'variant', 'color', 'size'],
        template: '<button :disabled="disabled" :data-loading="loading" :data-variant="variant" :data-color="color"><slot /></button>',
      },
    },
  },
});

describe('VPwaUpdatePrompt', () => {
  it('hides itself while idle', () => {
    const wrapper = mountPrompt({
      isUpdateReady: false,
      isOfflineReady: false,
      lifecycleState: 'idle',
      hasRegistrationError: false,
      appVersion: '',
    });

    expect(wrapper.find('[data-testid="pwa-update-prompt"]').exists()).toBe(false);
  });

  it('renders the update-ready state and emits reload and dismiss-update', async () => {
    const wrapper = mountPrompt({
      isUpdateReady: true,
      isOfflineReady: false,
      lifecycleState: 'updateReady',
      hasRegistrationError: false,
      appVersion: 'build-123',
    });

    expect(wrapper.text()).toContain('App update available');
    expect(wrapper.text()).toContain('Current build: build-123');

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);

    await buttons[0].trigger('click');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('reload')).toHaveLength(1);
    expect(wrapper.emitted('dismissUpdate')).toHaveLength(1);
  });

  it('keeps the update prompt visible and loading while reloading', () => {
    const wrapper = mountPrompt({
      isUpdateReady: false,
      isOfflineReady: false,
      lifecycleState: 'reloading',
      hasRegistrationError: false,
      appVersion: '',
    });

    const buttons = wrapper.findAll('button');
    expect(wrapper.text()).toContain('App update available');
    expect(buttons[0].attributes('data-loading')).toBe('true');
    expect(buttons[1].attributes('disabled')).toBeDefined();
  });

  it('renders offline-ready state and emits dismiss-offline-ready', async () => {
    const wrapper = mountPrompt({
      isUpdateReady: false,
      isOfflineReady: true,
      lifecycleState: 'offlineReady',
      hasRegistrationError: false,
      appVersion: '',
    });

    expect(wrapper.text()).toContain('Offline mode ready');
    expect(wrapper.find('[data-testid="alert"]').attributes('data-variant')).toBe('success');

    const button = wrapper.get('button');
    await button.trigger('click');

    expect(wrapper.emitted('dismissOfflineReady')).toHaveLength(1);
  });

  it('renders registration errors without interactive actions', () => {
    const wrapper = mountPrompt({
      isUpdateReady: false,
      isOfflineReady: false,
      lifecycleState: 'registrationError',
      hasRegistrationError: true,
      appVersion: '',
    });

    expect(wrapper.text()).toContain('Offline features unavailable');
    expect(wrapper.find('[data-testid="alert"]').attributes('data-variant')).toBe('error');
    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
