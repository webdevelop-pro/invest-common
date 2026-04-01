import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, toRefs } from 'vue';
import VFormAuthLogIn from '../VFormAuthLogIn.vue';

const loginStore = reactive({
  demoAccountHandler: vi.fn(),
  getErrorText: vi.fn(() => ''),
  isDemoAccountAvailable: true,
  isDemoAccountLoading: false,
  isDisabledButton: false,
  isFieldRequired: vi.fn(() => false),
  isLoading: false,
  loginPasswordHandler: vi.fn(),
  model: reactive({
    email: '',
    password: '',
  }),
  onSignup: vi.fn(),
  setLoginState: {
    error: null,
  },
});

const globalLoaderStore = reactive({
  isLoading: false,
});

vi.mock('InvestCommon/features/auth/store/useLogin', () => ({
  useLoginStore: () => loginStore,
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: () => globalLoaderStore,
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');

  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => toRefs(store),
  };
});

const mountComponent = () => mount(VFormAuthLogIn, {
  global: {
    stubs: {
      VButton: {
        props: ['disabled', 'loading'],
        template: `
          <button
            :data-testid="$attrs['data-testid']"
            :data-loading="String(loading)"
            :disabled="disabled || loading"
            @click="$emit('click', $event)"
          >
            <slot />
          </button>
        `,
      },
      VFormGroup: {
        template: '<div><slot :is-field-error="false" /></div>',
      },
      VFormInput: {
        props: ['disabled', 'isError', 'modelValue', 'name', 'placeholder', 'size', 'type'],
        template: '<input :type="type || \'text\'" />',
      },
      VFormInputPassword: {
        props: ['disabled', 'isError', 'modelValue', 'name', 'placeholder', 'size'],
        template: '<input type="password" />',
      },
    },
  },
});

describe('VFormAuthLogIn', () => {
  beforeEach(() => {
    loginStore.demoAccountHandler.mockReset();
    loginStore.getErrorText.mockClear();
    loginStore.isDemoAccountAvailable = true;
    loginStore.isDemoAccountLoading = false;
    loginStore.isDisabledButton = false;
    loginStore.isFieldRequired.mockClear();
    loginStore.isLoading = false;
    loginStore.loginPasswordHandler.mockReset();
    loginStore.onSignup.mockReset();
    globalLoaderStore.isLoading = false;
  });

  it('renders the demo CTA and delegates clicks to the login store', async () => {
    const wrapper = mountComponent();
    const demoButton = wrapper.get('[data-testid="demo-account-button"]');

    expect(demoButton.text()).toContain('Try Demo Account');

    await demoButton.trigger('click');

    expect(loginStore.demoAccountHandler).toHaveBeenCalled();
  });

  it('hides the demo CTA when the snapshot is unavailable', () => {
    loginStore.isDemoAccountAvailable = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="demo-account-button"]').exists()).toBe(false);
  });

  it('passes the demo loading state through to the CTA button', () => {
    loginStore.isDemoAccountLoading = true;

    const wrapper = mountComponent();

    expect(wrapper.get('[data-testid="demo-account-button"]').attributes('data-loading')).toBe('true');
  });
});
