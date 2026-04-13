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
import { useVDialogWalletAuth } from '../useVDialogWalletAuth';

const closeDialog = vi.fn(() => {
  isDialogWalletAuthOpen.value = false;
});
const clearCurrentError = vi.fn();
const submitCurrentStep = vi.fn(() => Promise.resolve());
const toast = vi.fn(() => ({ id: 'toast-1' }));
const dismiss = vi.fn();
const replace = vi.fn(() => Promise.resolve());

const route = reactive({
  query: {} as Record<string, string>,
});

const currentProfileState = shallowRef({
  errorMessage: '',
});
const isDialogWalletAuthOpen = shallowRef(true);
const selectedUserProfileData = shallowRef<{
  isKycApproved?: boolean;
  wallet?: { status?: string };
}>({
  isKycApproved: true,
  wallet: {
    status: '',
  },
});

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({
    toast,
    dismiss,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData,
  }),
}));

vi.mock('InvestCommon/features/wallet/auth/store/useWalletAuth', () => ({
  useWalletAuth: () => ({
    currentProfileState,
    isDialogWalletAuthOpen,
    closeDialog,
    clearCurrentError,
  }),
}));

vi.mock('../useWalletAuthSharedFlow', () => ({
  useWalletAuthSharedFlow: () => ({
    codeValue: computed({
      get: () => '',
      set: () => undefined,
    }),
    isBusy: computed(() => false),
    isCodeStep: computed(() => true),
    isOtpStep: computed(() => true),
    isMfaStep: computed(() => false),
    isSuccessStep: computed(() => false),
    isErrorStep: computed(() => false),
    title: computed(() => 'Verify Your Email'),
    description: computed(() => 'We sent a code.'),
    inputLabel: computed(() => 'Email Verification Code'),
    inputPlaceholder: computed(() => 'Enter email code'),
    inputHelperText: computed(() => 'Enter the 6-digit code we sent to your email.'),
    submitButtonText: computed(() => 'Verify Email'),
    isSubmitDisabled: computed(() => false),
    submitCurrentStep,
  }),
}));

const mountComposable = async (open = true) => {
  const dialogOpen = shallowRef(open);
  let api!: ReturnType<typeof useVDialogWalletAuth>;

  const wrapper = mount(defineComponent({
    setup() {
      api = useVDialogWalletAuth({
        open: dialogOpen,
      });

      return () => null;
    },
  }));

  await nextTick();

  return {
    api,
    dialogOpen,
    wrapper,
  };
};

describe('useVDialogWalletAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.query = {};
    currentProfileState.value = {
      errorMessage: '',
    };
    isDialogWalletAuthOpen.value = true;
    selectedUserProfileData.value = {
      isKycApproved: true,
      wallet: {
        status: '',
      },
    };
  });

  it('clears a stale wallet-auth popup query when wallet setup is no longer needed', async () => {
    route.query = {
      popup: 'wallet-auth',
      tab: 'wallet',
    };
    selectedUserProfileData.value = {
      isKycApproved: true,
      wallet: {
        status: 'verified',
      },
    };

    const { dialogOpen, wrapper } = await mountComposable(true);

    expect(closeDialog).toHaveBeenCalledTimes(1);
    expect(dialogOpen.value).toBe(false);
    expect(replace).toHaveBeenCalledWith({
      query: {
        tab: 'wallet',
      },
    });

    wrapper.unmount();
  });

  it('dismisses the previous wallet-auth toast before submitting again', async () => {
    const { api, wrapper } = await mountComposable(true);

    currentProfileState.value = {
      errorMessage: 'Invalid OTP code',
    };
    await nextTick();

    await api.handlePrimaryClick();

    expect(dismiss).toHaveBeenCalledWith('toast-1');
    expect(submitCurrentStep).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
