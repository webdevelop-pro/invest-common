import {
  describe,
  expect,
  it,
} from 'vitest';
import { mount } from '@vue/test-utils';
import VNativePushPrompt from '../VNativePushPrompt.vue';

const mountPrompt = (props: Record<string, unknown>) => mount(VNativePushPrompt, {
  props,
  global: {
    stubs: {
      VAlert: {
        template: '<section data-testid="alert"><slot name="title" /><slot name="description" /><slot /></section>',
      },
      VButton: {
        props: ['loading', 'disabled', 'variant', 'color', 'size'],
        template: '<button :disabled="disabled" :data-loading="loading" :data-variant="variant" :data-color="color"><slot /></button>',
      },
    },
  },
});

describe('VNativePushPrompt', () => {
  it('hides itself when not visible', () => {
    const wrapper = mountPrompt({
      isVisible: false,
    });

    expect(wrapper.find('[data-testid="native-push-prompt"]').exists()).toBe(false);
  });

  it('renders explainer copy and emits accept and dismiss actions', async () => {
    const wrapper = mountPrompt({
      isVisible: true,
      isLoading: false,
    });

    expect(wrapper.text()).toContain('Enable push notifications');
    expect(wrapper.text()).toContain('account, offering, wallet, and platform updates');

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toContain('Enable');
    expect(buttons[0].attributes('data-color')).toBe('primary');
    expect(buttons[1].text()).toContain('Not now');
    expect(buttons[1].attributes('data-variant')).toBe('outlined');

    await buttons[0].trigger('click');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('accept')).toHaveLength(1);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('disables actions while loading', () => {
    const wrapper = mountPrompt({
      isVisible: true,
      isLoading: true,
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();
    expect(buttons[0].attributes('data-loading')).toBe('true');
  });
});
