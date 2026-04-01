/* eslint-disable vue/one-component-per-file */

import { mount } from '@vue/test-utils';
import {
  defineComponent,
  h,
  onMounted,
  reactive,
} from 'vue';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import VPageTopInfoAndTabs from './VPageTopInfoAndTabs.vue';

const routeState = reactive({
  fullPath: '/profile/1032/portfolio',
});

const routerPush = vi.fn();
const routerResolve = vi.fn((target: { name?: string } | string) => (
  typeof target === 'string'
    ? { fullPath: target }
    : {
        fullPath: target.name === 'ROUTE_DASHBOARD_SUMMARY'
          ? '/profile/1032/summary'
          : '/profile/1032/portfolio',
      }
));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');

  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({
      push: routerPush,
      resolve: routerResolve,
    }),
  };
});

describe('VPageTopInfoAndTabs', () => {
  beforeEach(() => {
    routeState.fullPath = '/profile/1032/portfolio';
    routerPush.mockReset();
    routerResolve.mockClear();
  });

  it('pushes the tab route when the selected tab changes', async () => {
    const wrapper = mount(VPageTopInfoAndTabs, {
      props: {
        tab: 'portfolio',
        tabs: {
          portfolio: {
            value: 'portfolio',
            label: 'Portfolio',
            to: '/profile/1032/account?tab=portfolio',
          },
          summary: {
            value: 'summary',
            label: 'Summary',
            to: '/profile/1032/account?tab=summary',
          },
        },
      },
      slots: {
        'top-info': '<div data-testid="top-info" />',
        'tabs-content': '<div data-testid="tabs-content" />',
      },
      global: {
        stubs: {
          VTabs: defineComponent({
            emits: ['update:modelValue'],
            template: `
              <div data-testid="tabs-root">
                <button
                  data-testid="switch-summary"
                  type="button"
                  @click="$emit('update:modelValue', 'summary')"
                >
                  Switch
                </button>
                <slot />
              </div>
            `,
          }),
          VTabsList: defineComponent({
            template: '<div data-testid="tabs-list"><slot /></div>',
          }),
          VTabsTrigger: defineComponent({
            props: {
              value: { type: String, required: false, default: '' },
            },
            template: '<button type="button"><slot /><slot name="subtitle" /></button>',
          }),
        },
      },
    });

    await wrapper.get('[data-testid="switch-summary"]').trigger('click');

    expect(routerPush).toHaveBeenCalledWith('/profile/1032/account?tab=summary');
  });

  it('does not push when the resolved route already matches the current URL', async () => {
    routeState.fullPath = '/profile/1032/account?tab=summary';

    const wrapper = mount(VPageTopInfoAndTabs, {
      props: {
        tab: 'summary',
        tabs: {
          summary: {
            value: 'summary',
            label: 'Summary',
            to: '/profile/1032/account?tab=summary',
          },
        },
      },
      slots: {
        'tabs-content': '<div data-testid="tabs-content" />',
      },
      global: {
        stubs: {
          VTabs: defineComponent({
            emits: ['update:modelValue'],
            template: `
              <div data-testid="tabs-root">
                <button
                  data-testid="switch-summary"
                  type="button"
                  @click="$emit('update:modelValue', 'summary')"
                >
                  Switch
                </button>
                <slot />
              </div>
            `,
          }),
          VTabsList: defineComponent({
            template: '<div data-testid="tabs-list"><slot /></div>',
          }),
          VTabsTrigger: defineComponent({
            props: {
              value: { type: String, required: false, default: '' },
            },
            template: '<button type="button"><slot /><slot name="subtitle" /></button>',
          }),
        },
      },
    });

    await wrapper.get('[data-testid="switch-summary"]').trigger('click');

    expect(routerPush).not.toHaveBeenCalled();
  });

  it('ignores the initial same-tab emit from VTabs', async () => {
    mount(VPageTopInfoAndTabs, {
      props: {
        tab: 'summary',
        tabs: {
          summary: {
            value: 'summary',
            label: 'Summary',
            to: '/profile/1032/account?tab=summary',
          },
        },
      },
      slots: {
        'tabs-content': '<div data-testid="tabs-content" />',
      },
      global: {
        stubs: {
          VTabs: defineComponent({
            emits: ['update:modelValue'],
            setup(_, { emit, slots }) {
              onMounted(() => {
                emit('update:modelValue', 'summary');
              });

              return () => h('div', { 'data-testid': 'tabs-root' }, slots.default?.());
            },
          }),
          VTabsList: defineComponent({
            template: '<div data-testid="tabs-list"><slot /></div>',
          }),
          VTabsTrigger: defineComponent({
            props: {
              value: { type: String, required: false, default: '' },
            },
            template: '<button type="button"><slot /><slot name="subtitle" /></button>',
          }),
        },
      },
    });

    expect(routerPush).not.toHaveBeenCalled();
  });
});
