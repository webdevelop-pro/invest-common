import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import VOfflinePageState from '../VOfflinePageState.vue';

describe('VOfflinePageState', () => {
  it('renders the offline page defaults', () => {
    const wrapper = mount(VOfflinePageState, {
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="offline-page-state"]').text()).toContain('You\'re currently offline');
    expect(wrapper.text()).toContain('Invest PRO needs an internet connection');
    expect(wrapper.text()).toContain('Try again');
    expect(wrapper.text()).toContain('Go to home');
  });

  it('renders the retry action and configured secondary action', () => {
    const wrapper = mount(VOfflinePageState, {
      props: {
        title: 'This investment page is offline',
        secondaryAction: {
          label: 'Back to Portfolio',
          href: '/dashboard/profile/42/portfolio',
        },
      },
    });

    expect(wrapper.text()).toContain('This investment page is offline');
    expect(wrapper.get('button').text()).toBe('Try again');
    expect(wrapper.get('a').attributes('href')).toBe('/dashboard/profile/42/portfolio');
  });
});
