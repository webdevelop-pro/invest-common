import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, toRefs } from 'vue';
import VFormAuthSignUp from '../VFormAuthSignUp.vue';

const signupStore = reactive({
  checkbox: false,
  demoAccountHandler: vi.fn(),
  getErrorText: vi.fn(() => ''),
  isDemoAccountAvailable: true,
  isDemoAccountLoading: false,
  isDisabledButton: true,
  isFieldRequired: vi.fn(() => false),
  isLoading: false,
  model: reactive({
    create_password: '',
    email: '',
    first_name: '',
    last_name: '',
    repeat_password: '',
  }),
  onLogin: vi.fn(),
  onMountedHandler: vi.fn(),
  queryFlow: undefined as string | undefined,
  setSignupState: {
    error: null,
  },
  signupPasswordHandler: vi.fn(),
});

const globalLoaderStore = reactive({
  isLoading: false,
});

vi.mock('InvestCommon/features/auth/store/useSignup', () => ({
  useSignupStore: () => signupStore,
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

const mountComponent = () => mount(VFormAuthSignUp, {
  global: {
    stubs: {
      FormCol: {
        template: '<div><slot /></div>',
      },
      FormRow: {
        template: '<div><slot /></div>',
      },
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
      VFormCheckbox: {
        template: '<label><slot /></label>',
      },
      VFormGroup: {
        template: '<div><slot :is-field-error="false" /></div>',
      },
      VFormInput: {
        props: ['disabled', 'isError', 'modelValue', 'name', 'placeholder', 'size', 'type'],
        template: '<input :type="type || \'text\'" />',
      },
      VFormInputPassword: {
        props: ['isError', 'modelValue', 'name', 'placeholder', 'showStrength', 'size'],
        template: '<input type="password" />',
      },
    },
  },
});

describe('VFormAuthSignUp', () => {
  beforeEach(() => {
    signupStore.checkbox = false;
    signupStore.demoAccountHandler.mockReset();
    signupStore.getErrorText.mockClear();
    signupStore.isDemoAccountAvailable = true;
    signupStore.isDemoAccountLoading = false;
    signupStore.isDisabledButton = true;
    signupStore.isFieldRequired.mockClear();
    signupStore.isLoading = false;
    signupStore.onLogin.mockReset();
    signupStore.onMountedHandler.mockReset();
    signupStore.queryFlow = undefined;
    signupStore.signupPasswordHandler.mockReset();
    globalLoaderStore.isLoading = false;
  });

  it('renders the demo CTA and delegates clicks to the signup store', async () => {
    const wrapper = mountComponent();
    const demoButton = wrapper.get('[data-testid="demo-account-button"]');

    expect(demoButton.text()).toContain('Try Demo Account');

    await demoButton.trigger('click');

    expect(signupStore.demoAccountHandler).toHaveBeenCalled();
  });

  it('hides the demo CTA when the snapshot is unavailable', () => {
    signupStore.isDemoAccountAvailable = false;

    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="demo-account-button"]').exists()).toBe(false);
  });

  it('passes the demo loading state through to the CTA button', () => {
    signupStore.isDemoAccountLoading = true;

    const wrapper = mountComponent();

    expect(wrapper.get('[data-testid="demo-account-button"]').attributes('data-loading')).toBe('true');
  });
});
