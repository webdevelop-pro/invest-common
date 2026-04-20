import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import {
  computed,
  defineComponent,
  nextTick,
  reactive,
  shallowRef,
} from 'vue';
import {
  ROUTE_DASHBOARD_ACCOUNT,
} from 'InvestCommon/domain/config/enums/routes';
import { useWalletAuthOtpPage } from '../useWalletAuthOtpPage';

const hideGlobalLoader = vi.fn();
const mockPush = vi.fn(() => Promise.resolve());
const ensureWalletAuthFlow = vi.fn(() => Promise.resolve());
const retry = vi.fn(() => Promise.resolve());
const submitCurrentStep = vi.fn(() => Promise.resolve());
const clearCurrentError = vi.fn();
const clearCompletedPostAuthAction = vi.fn();
const toast = vi.fn(() => ({ id: 'toast-1' }));
const dismiss = vi.fn();

const route = reactive({
  params: {
    profileId: '7',
  },
  query: {} as Record<string, string>,
});

const isSuccessStep = shallowRef(false);
const currentProfileState = shallowRef({
  step: 'intro',
  errorMessage: '',
});
const completedPostAuthAction = shallowRef<null | 'zero_transaction_warmup'>(null);
const selectedUserProfileId = shallowRef<number | null>(7);
const selectedUserProfileType = shallowRef('individual');

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: () => ({
    hide: hideGlobalLoader,
  }),
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({
    toast,
    dismiss,
  }),
}));

vi.mock('InvestCommon/domain/config/links', () => ({
  urlProfileKYC: (profileId: number) => `/profile/${profileId}/kyc`,
}));
vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}));

vi.mock('InvestCommon/features/wallet/auth/store/useWalletAuth', () => ({
  useWalletAuth: () => ({
    currentProfileState,
    completedPostAuthAction,
    clearCurrentError,
    clearCompletedPostAuthAction,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId,
    selectedUserProfileType,
  }),
}));

vi.mock('../useWalletAuthSharedFlow', () => ({
  useWalletAuthSharedFlow: () => ({
    title: computed(() => 'Verify Your Email'),
    codeValue: computed({
      get: () => '',
      set: () => undefined,
    }),
    description: computed(() => 'We sent a code.'),
    inputLabel: computed(() => 'Email Verification Code'),
    inputPlaceholder: computed(() => 'Enter email code'),
    inputHelperText: computed(() => 'Enter the 6-digit code we sent to your email.'),
    submitButtonText: computed(() => 'Verify Email'),
    isBusy: computed(() => false),
    isOtpStep: computed(() => true),
    isMfaStep: computed(() => false),
    isErrorStep: computed(() => false),
    isSubmitDisabled: computed(() => false),
    isSuccessStep,
    ensureWalletAuthFlow,
    retry,
    submitCurrentStep,
  }),
}));

const mountComposable = async () => {
  let api!: ReturnType<typeof useWalletAuthOtpPage>;

  const wrapper = mount(defineComponent({
    setup() {
      api = useWalletAuthOtpPage();
      return () => null;
    },
  }));

  await nextTick();

  return { wrapper, api };
};

describe('useWalletAuthOtpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.params.profileId = '7';
    route.query = {};
    selectedUserProfileId.value = 7;
    selectedUserProfileType.value = 'individual';
    isSuccessStep.value = false;
    currentProfileState.value = {
      step: 'intro',
      errorMessage: '',
    };
    completedPostAuthAction.value = null;
  });

  it('starts wallet auth automatically on mount', async () => {
    const { wrapper } = await mountComposable();

    expect(hideGlobalLoader).toHaveBeenCalledTimes(1);
    expect(ensureWalletAuthFlow).toHaveBeenCalledTimes(1);
    expect(ensureWalletAuthFlow).toHaveBeenCalledWith(7, {
      openDialog: false,
      startIfMissing: true,
    });

    wrapper.unmount();
  });

  it('restarts the flow when the profile id changes', async () => {
    const { wrapper } = await mountComposable();

    route.params.profileId = '8';
    await nextTick();

    expect(ensureWalletAuthFlow).toHaveBeenCalledTimes(2);
    expect(ensureWalletAuthFlow).toHaveBeenLastCalledWith(8, {
      openDialog: false,
      startIfMissing: true,
    });

    wrapper.unmount();
  });

  it('uses the selected profile id when the wallet otp route keeps the signup placeholder id', async () => {
    route.params.profileId = '0';
    selectedUserProfileId.value = 11;

    const { wrapper } = await mountComposable();

    expect(ensureWalletAuthFlow).toHaveBeenCalledWith(11, {
      openDialog: false,
      startIfMissing: true,
    });

    wrapper.unmount();
  });

  it('shows a success toast and redirects to dashboard after deferred zero-transaction warmup succeeds', async () => {
    completedPostAuthAction.value = 'zero_transaction_warmup';
    const { wrapper } = await mountComposable();

    isSuccessStep.value = true;
    await nextTick();

    expect(toast).toHaveBeenCalledWith({
      title: 'Zero Transaction Sent',
      description: 'Your wallet is ready.',
    });
    expect(clearCompletedPostAuthAction).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: 7 },
    });

    wrapper.unmount();
  });

  it('redirects to the selected profile dashboard when the wallet otp route uses profile 0', async () => {
    route.params.profileId = '0';
    selectedUserProfileId.value = 11;
    completedPostAuthAction.value = 'zero_transaction_warmup';
    const { wrapper } = await mountComposable();

    isSuccessStep.value = true;
    await nextTick();

    expect(mockPush).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: 11 },
    });

    wrapper.unmount();
  });

  it('redirects to dashboard on success regardless of query params', async () => {
    route.query = {};
    const { wrapper } = await mountComposable();

    isSuccessStep.value = true;
    await nextTick();

    expect(mockPush).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: 7 },
    });

    wrapper.unmount();
  });

  it('shows a success toast', async () => {
    const { wrapper } = await mountComposable();

    isSuccessStep.value = true;
    await nextTick();

    expect(toast).toHaveBeenCalledWith({
      title: 'Wallet Connected',
      description: 'Your wallet authentication is complete.',
      variant: 'success',
    });

    wrapper.unmount();
  });

  it('redirects to the account dashboard after wallet auth succeeds', async () => {
    const { wrapper } = await mountComposable();

    isSuccessStep.value = true;
    await nextTick();

    expect(mockPush).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: 7 },
    });

    wrapper.unmount();
  });

  it('shows a toast and clears non-error-step page failures', async () => {
    const { wrapper } = await mountComposable();

    currentProfileState.value = {
      step: 'awaiting_otp',
      errorMessage: 'Max number of OTPs have been initiated please wait and try again',
    };
    await nextTick();

    expect(toast).toHaveBeenCalledWith({
      title: 'Wallet Setup Needs Attention',
      description: 'Max number of OTPs have been initiated please wait and try again',
      variant: 'error',
    });
    expect(clearCurrentError).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('shows a toast but keeps the message when the page is already in the error step', async () => {
    const { wrapper } = await mountComposable();

    currentProfileState.value = {
      step: 'error',
      errorMessage: 'Temporary backend issue.',
    };
    await nextTick();

    expect(toast).toHaveBeenCalledWith({
      title: 'Wallet Setup Needs Attention',
      description: 'Temporary backend issue.',
      variant: 'error',
    });
    expect(clearCurrentError).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('dismisses the previous wallet-auth toast before retrying the flow', async () => {
    const { api, wrapper } = await mountComposable();

    currentProfileState.value = {
      step: 'error',
      errorMessage: 'Temporary backend issue.',
    };
    await nextTick();

    await api.retry();

    expect(dismiss).toHaveBeenCalledWith('toast-1');
    expect(retry).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('dismisses the previous wallet-auth toast before submitting another code', async () => {
    const { api, wrapper } = await mountComposable();

    currentProfileState.value = {
      step: 'awaiting_otp',
      errorMessage: 'Invalid OTP code',
    };
    await nextTick();

    await api.submitCurrentStep();

    expect(dismiss).toHaveBeenCalledWith('toast-1');
    expect(submitCurrentStep).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
