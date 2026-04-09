import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import VKycActionButton from '../VKycActionButton.vue';

const alertModel = ref({
  show: true,
  variant: 'error' as const,
  title: '',
  description: '',
  buttonText: 'Continue',
  isLoading: false,
  isDisabled: false,
});

const onPrimaryAction = vi.fn();

vi.mock('InvestCommon/features/kyc/logic/useKycAlertViewModel', () => ({
  useKycAlertViewModel: () => ({
    alertModel,
    onPrimaryAction,
  }),
}));

describe('VKycActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertModel.value = {
      show: true,
      variant: 'error',
      title: '',
      description: '',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
    };
  });

  it('renders the centralized KYC CTA and triggers the primary action', async () => {
    const wrapper = mount(VKycActionButton, {
      props: {
        size: 'large',
      },
      global: {
        stubs: {
          VButton: {
            props: ['disabled', 'loading', 'size'],
            emits: ['click'],
            template: '<button class="kyc-action-btn" :data-loading="String(loading)" :data-size="size" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Continue');
    expect(wrapper.get('.kyc-action-btn').attributes('data-size')).toBe('large');

    await wrapper.get('.kyc-action-btn').trigger('click');
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('passes centralized loading and disabled state to the button', () => {
    alertModel.value = {
      ...alertModel.value,
      isLoading: true,
      isDisabled: true,
    };

    const wrapper = mount(VKycActionButton, {
      global: {
        stubs: {
          VButton: {
            props: ['disabled', 'loading', 'size'],
            template: '<button class="kyc-action-btn" :data-loading="String(loading)" :disabled="disabled"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.get('.kyc-action-btn').attributes('data-loading')).toBe('true');
    expect(wrapper.get('.kyc-action-btn').attributes()).toHaveProperty('disabled');
  });

  it('does not render when the alert model has no button text', () => {
    alertModel.value = {
      ...alertModel.value,
      buttonText: undefined,
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mount(VKycActionButton, {
      global: {
        stubs: {
          VButton: {
            props: ['disabled', 'loading', 'size'],
            template: '<button class="kyc-action-btn"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.find('.kyc-action-btn').exists()).toBe(false);
  });

  it('does not render when the centralized alert is hidden', () => {
    alertModel.value = {
      ...alertModel.value,
      show: false,
      buttonText: undefined,
    };

    const wrapper = mount(VKycActionButton, {
      global: {
        stubs: {
          VButton: {
            props: ['disabled', 'loading', 'size'],
            template: '<button class="kyc-action-btn"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.find('.kyc-action-btn').exists()).toBe(false);
  });
});
