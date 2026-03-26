import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import VOfflineDataUnavailable from '../VOfflineDataUnavailable.vue';

describe('VOfflineDataUnavailable', () => {
  it('renders the default offline copy', () => {
    const wrapper = mount(VOfflineDataUnavailable, {
      global: {
        stubs: {
          VAlert: {
            template: '<div><slot name="title" /><slot name="description" /><slot /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('This page is unavailable offline');
    expect(wrapper.text()).toContain('read-only mode');
  });

  it('renders configured actions', () => {
    const wrapper = mount(VOfflineDataUnavailable, {
      props: {
        primaryAction: {
          label: 'Back to Portfolio',
          to: { name: 'portfolio' },
        },
        secondaryAction: {
          label: 'Explore Offers',
          href: '/offers',
        },
      },
      global: {
        stubs: {
          VAlert: {
            template: '<div><slot name="title" /><slot name="description" /><slot /></div>',
          },
          VButton: {
            props: ['href', 'to'],
            template: '<button :data-href="href" :data-to="JSON.stringify(to)"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Back to Portfolio');
    expect(wrapper.text()).toContain('Explore Offers');
  });
});
