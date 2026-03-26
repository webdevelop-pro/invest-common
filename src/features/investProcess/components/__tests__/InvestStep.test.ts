import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import InvestStep from '../InvestStep.vue';

vi.mock('../logic/useInvestStep', () => ({
  useInvestStep: () => ({
    currentTab: ref(1),
    steps: [],
    maxAvailableStep: ref(1),
    isOfflineUnavailable: ref(true),
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      profileId: '42',
      slug: 'test-offer',
    },
  }),
}));

describe('InvestStep', () => {
  it('renders the offline unavailable state instead of the step content', () => {
    const wrapper = mount(InvestStep, {
      props: {
        title: 'Investment',
        stepNumber: 1,
      },
      slots: {
        default: '<div data-testid="step-content">Step body</div>',
      },
      global: {
        stubs: {
          VStepper: true,
          InvestStepFooter: true,
          VAlert: {
            template: '<div><slot name="title" /><slot name="description" /><slot /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="offline-data-unavailable"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="step-content"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Investment flow unavailable offline');
  });
});

