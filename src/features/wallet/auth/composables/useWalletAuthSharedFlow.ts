import { computed, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import {
  type WalletAuthStep,
  type WalletAuthOpenPayload,
  useWalletAuth,
} from 'InvestCommon/features/wallet/auth/store/useWalletAuth';

type WalletAuthStepPresentation = {
  title: string;
  description: string;
  submitButtonText: string;
};

const OTP_FLOW_STEPS = new Set<WalletAuthStep>([
  'sending_otp',
  'awaiting_otp',
]);
const BUSY_STEPS = new Set<WalletAuthStep>([
  'sending_otp',
  'binding',
]);

const OTP_FIELD_COPY = {
  label: 'Email Verification Code',
  placeholder: 'Enter email code',
  helperText: 'Enter the 6-digit code we sent to your email.',
} as const;

const MFA_FIELD_COPY = {
  label: 'Authenticator Code',
  placeholder: 'Enter authenticator code',
  helperText: 'Enter the 6-digit code from your authenticator app.',
} as const;

type EnsureWalletAuthFlowOptions = {
  openDialog?: boolean;
  startIfMissing?: boolean;
};

type SubmitCurrentStepOptions = {
  onSuccess?: () => void | Promise<void>;
};

const getCodeFieldCopy = (isMfaStep: boolean) => (
  isMfaStep
    ? MFA_FIELD_COPY
    : OTP_FIELD_COPY
);

const resetCodeForStep = (
  step: WalletAuthStep,
  otpCode: { value: string },
  mfaCode: { value: string },
) => {
  if (step === 'awaiting_otp') {
    otpCode.value = '';
  }

  if (step === 'awaiting_mfa') {
    mfaCode.value = '';
  }
};

export function useWalletAuthSharedFlow() {
  const otpCode = shallowRef('');
  const mfaCode = shallowRef('');

  const walletAuthStore = useWalletAuth();
  const profilesStore = useProfilesStore();
  const sessionStore = useSessionStore();

  const {
    currentProfileId,
    currentProfileState,
  } = storeToRefs(walletAuthStore);
  const {
    selectedUserProfileData,
    selectedUserProfileType,
  } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);

  const currentStep = computed(() => currentProfileState.value.step);
  const currentEmail = computed(() => currentProfileState.value.email);

  const isBusy = computed(() => BUSY_STEPS.has(currentStep.value));
  const isOtpStep = computed(() => currentStep.value === 'awaiting_otp');
  const isMfaStep = computed(() => currentStep.value === 'awaiting_mfa');
  const isSuccessStep = computed(() => currentStep.value === 'success');
  const isErrorStep = computed(() => currentStep.value === 'error');
  const isCodeStep = computed(() => isOtpStep.value || isMfaStep.value);

  const presentation = computed<WalletAuthStepPresentation>(() => {
    if (isSuccessStep.value) {
      return {
        title: 'Wallet Connected',
        description: 'Your wallet authentication is complete. We are refreshing the latest wallet status now.',
        submitButtonText: 'Done',
      };
    }

    if (isErrorStep.value) {
      return {
        title: 'Wallet Setup Needs Attention',
        description: currentProfileState.value.errorMessage || 'We could not finish wallet setup.',
        submitButtonText: 'Try Again',
      };
    }

    if (isMfaStep.value) {
      return {
        title: 'Verify Authenticator Code',
        description: 'Enter the 6-digit code from your authenticator app to finish wallet setup.',
        submitButtonText: 'Verify Code',
      };
    }

    if (OTP_FLOW_STEPS.has(currentStep.value)) {
      return {
        title: 'Verify Your Email',
        description: `We sent a 6-digit verification code to ${currentEmail.value}.`,
        submitButtonText: 'Verify Email',
      };
    }

    return {
      title: 'Set Up Your Crypto Wallet',
      description: currentEmail.value
        ? `We will send a one-time code to ${currentEmail.value} to connect the wallet for this profile.`
        : 'Continue to send a one-time email code and connect the wallet for this profile.',
      submitButtonText: 'Continue',
    };
  });

  const activeCodeFieldCopy = computed(() => (
    getCodeFieldCopy(isMfaStep.value)
  ));

  const codeValue = computed({
    get: () => (isMfaStep.value ? mfaCode.value : otpCode.value),
    set: (value: string) => {
      if (isMfaStep.value) {
        mfaCode.value = value;
        return;
      }

      otpCode.value = value;
    },
  });

  const isSubmitDisabled = computed(() => isCodeStep.value && !codeValue.value);

  const resolveWalletAuthPayload = (profileId?: number | null): WalletAuthOpenPayload | null => {
    const resolvedProfileId = profileId ?? currentProfileId.value;

    if (resolvedProfileId === null || Number.isNaN(Number(resolvedProfileId))) {
      return null;
    }

    return {
      profileId: Number(resolvedProfileId),
      isKycApproved: selectedUserProfileData.value?.isKycApproved,
      profileType: selectedUserProfileType.value || PROFILE_TYPES.INDIVIDUAL,
      profileName: selectedUserProfileData.value?.name,
      fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
      userEmail: userSessionTraits.value?.email || selectedUserProfileData.value?.data?.email,
      walletStatus: selectedUserProfileData.value?.wallet?.status,
    };
  };

  const startWalletAuthFlow = async (
    profileId?: number | null,
    options: EnsureWalletAuthFlowOptions = {},
  ) => {
    const payload = resolveWalletAuthPayload(profileId);
    if (!payload) {
      return null;
    }

    await walletAuthStore.startFlowForProfile(payload, {
      openDialog: options.openDialog,
    });

    return payload;
  };

  const ensureWalletAuthFlow = async (
    profileId?: number | null,
    options: EnsureWalletAuthFlowOptions = {},
  ) => {
    const payload = resolveWalletAuthPayload(profileId);
    if (!payload) {
      return;
    }

    walletAuthStore.prepareFlowForProfile(payload);
    if (options.startIfMissing === false) {
      return;
    }

    await walletAuthStore.startFlowForProfile(payload, {
      openDialog: options.openDialog,
    });
  };

  const retry = async () => {
    await walletAuthStore.retryCurrentStep(resolveWalletAuthPayload() ?? undefined);
  };

  const submitCurrentStep = async (options: SubmitCurrentStepOptions = {}) => {
    switch (currentStep.value) {
      case 'success':
        await options.onSuccess?.();
        return;
      case 'error':
        await retry();
        return;
      case 'awaiting_otp':
        await walletAuthStore.submitOtp(otpCode.value);
        return;
      case 'awaiting_mfa':
        await walletAuthStore.submitMfa(mfaCode.value);
        return;
      default:
        await startWalletAuthFlow(undefined, {
          openDialog: true,
        });
    }
  };

  watch([currentProfileId, currentStep], ([profileId, step], [previousProfileId, previousStep]) => {
    if (profileId !== previousProfileId) {
      otpCode.value = '';
      mfaCode.value = '';
    }

    if (step === previousStep) {
      return;
    }

    resetCodeForStep(step, otpCode, mfaCode);
  });

  return {
    codeValue,
    title: computed(() => presentation.value.title),
    description: computed(() => presentation.value.description),
    inputLabel: computed(() => activeCodeFieldCopy.value.label),
    inputPlaceholder: computed(() => activeCodeFieldCopy.value.placeholder),
    inputHelperText: computed(() => activeCodeFieldCopy.value.helperText),
    submitButtonText: computed(() => presentation.value.submitButtonText),
    isBusy,
    isOtpStep,
    isMfaStep,
    isSuccessStep,
    isErrorStep,
    isCodeStep,
    isSubmitDisabled,
    buildWalletAuthPayload: resolveWalletAuthPayload,
    ensureWalletAuthFlow,
    retry,
    submitCurrentStep,
  };
}
