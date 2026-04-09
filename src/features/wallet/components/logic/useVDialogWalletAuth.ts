import { computed, ref, watch, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useWalletAuth } from 'InvestCommon/features/wallet/store/useWalletAuth';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

interface UseVDialogWalletAuthOptions {
  open: Ref<boolean | undefined>;
}

export function useVDialogWalletAuth(options: UseVDialogWalletAuthOptions) {
  const otpCode = ref('');
  const mfaCode = ref('');

  const walletAuthStore = useWalletAuth();
  const profilesStore = useProfilesStore();
  const sessionStore = useSessionStore();
  const { toast } = useToast();

  const {
    currentProfileId,
    currentProfileState,
  } = storeToRefs(walletAuthStore);
  const {
    selectedUserProfileData,
    selectedUserProfileType,
  } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);

  const isBusy = computed(() => ['sending_otp', 'binding'].includes(currentProfileState.value.step));
  const isOtpStep = computed(() => currentProfileState.value.step === 'awaiting_otp');
  const isMfaStep = computed(() => currentProfileState.value.step === 'awaiting_mfa');
  const isSuccessStep = computed(() => currentProfileState.value.step === 'success');
  const isErrorStep = computed(() => currentProfileState.value.step === 'error');

  const dialogTitle = computed(() => {
    if (isSuccessStep.value) {
      return 'Wallet Connected';
    }

    if (isErrorStep.value) {
      return 'Wallet Setup Needs Attention';
    }

    if (isMfaStep.value) {
      return 'Verify Authenticator Code';
    }

    if (isOtpStep.value) {
      return 'Verify Your Email';
    }

    return 'Set Up Your Crypto Wallet';
  });

  const stepDescription = computed(() => {
    if (isSuccessStep.value) {
      return 'Your wallet authentication is complete. We are refreshing the latest wallet status now.';
    }

    if (isErrorStep.value) {
      return currentProfileState.value.errorMessage || 'We could not finish wallet setup.';
    }

    if (isMfaStep.value) {
      return 'Enter the 6-digit code from your authenticator app to finish wallet setup.';
    }

    if (isOtpStep.value) {
      return `We sent a 6-digit verification code to ${currentProfileState.value.email}.`;
    }

    return currentProfileState.value.email
      ? `We will send a one-time code to ${currentProfileState.value.email} to connect the wallet for this profile.`
      : 'Continue to send a one-time email code and connect the wallet for this profile.';
  });

  const primaryButtonText = computed(() => {
    if (isSuccessStep.value) {
      return 'Done';
    }

    if (isErrorStep.value) {
      return 'Try Again';
    }

    if (isMfaStep.value) {
      return 'Verify Code';
    }

    if (isOtpStep.value) {
      return 'Verify Email';
    }

    return 'Continue';
  });

  const isPrimaryDisabled = computed(() => (
    (isOtpStep.value && !otpCode.value) || (isMfaStep.value && !mfaCode.value)
  ));

  const closeDialog = () => {
    walletAuthStore.closeDialog();
    options.open.value = false;
  };

  const startWalletFlow = async (profileId: number) => {
    await walletAuthStore.startFlowForProfile({
      profileId,
      isKycApproved: selectedUserProfileData.value?.isKycApproved,
      profileType: selectedUserProfileType.value,
      profileName: selectedUserProfileData.value?.name,
      fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
      userEmail: userSessionTraits.value?.email,
      walletStatus: selectedUserProfileData.value?.wallet?.status,
    });
  };

  const handlePrimaryClick = async () => {
    const profileId = Number(currentProfileId.value);
    if (!profileId) {
      return;
    }

    if (isSuccessStep.value) {
      closeDialog();
      return;
    }

    if (isErrorStep.value) {
      await walletAuthStore.retryCurrentStep();
      return;
    }

    if (isOtpStep.value) {
      await walletAuthStore.submitOtp(otpCode.value);
      return;
    }

    if (isMfaStep.value) {
      await walletAuthStore.submitMfa(mfaCode.value);
      return;
    }

    await startWalletFlow(profileId);
  };

  watch(options.open, (isOpen) => {
    if (!isOpen) {
      walletAuthStore.closeDialog();
    }
  });

  watch(() => walletAuthStore.isDialogWalletAuthOpen, (isOpen) => {
    options.open.value = isOpen;
  }, { immediate: true });

  watch(
    () => currentProfileState.value.errorMessage,
    (errorMessage, previousErrorMessage) => {
      if (!errorMessage || errorMessage === previousErrorMessage || !options.open.value) {
        return;
      }

      toast({
        title: 'Wallet Setup Needs Attention',
        description: errorMessage,
        variant: 'error',
      });
      walletAuthStore.clearCurrentError();
    },
  );

  return {
    otpCode,
    mfaCode,
    isBusy,
    isOtpStep,
    isMfaStep,
    isSuccessStep,
    isErrorStep,
    dialogTitle,
    stepDescription,
    primaryButtonText,
    isPrimaryDisabled,
    closeDialog,
    handlePrimaryClick,
  };
}
