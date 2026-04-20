import {
  computed,
  shallowRef,
  watch,
  type Ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useWalletAuth } from 'InvestCommon/features/wallet/auth/store/useWalletAuth';
import { shouldPromptWalletAuth } from '../logic/walletAuth.helpers';
import { useWalletAuthSharedFlow } from './useWalletAuthSharedFlow';

interface UseVDialogWalletAuthOptions {
  open: Ref<boolean | undefined>;
}

export function useVDialogWalletAuth(options: UseVDialogWalletAuthOptions) {
  const route = useRoute();
  const router = useRouter();
  const walletAuthStore = useWalletAuth();
  const profilesStore = useProfilesStore();
  const { toast, dismiss } = useToast();
  const sharedFlow = useWalletAuthSharedFlow();
  const walletAuthErrorToastId = shallowRef<string | null>(null);

  const {
    currentProfileState,
    isDialogWalletAuthOpen,
  } = storeToRefs(walletAuthStore);
  const { selectedUserProfileData } = storeToRefs(profilesStore);

  const shouldKeepWalletAuthPrompt = computed(() => shouldPromptWalletAuth({
    isKycApproved: selectedUserProfileData.value?.isKycApproved,
    walletStatus: selectedUserProfileData.value?.wallet?.status,
  }));

  const clearWalletAuthPopupQuery = async () => {
    if (route.query.popup !== 'wallet-auth') {
      return;
    }

    const nextQuery = { ...route.query };
    delete nextQuery.popup;

    await router.replace({
      query: nextQuery,
    });
  };

  const dismissWalletAuthErrorToast = () => {
    if (!walletAuthErrorToastId.value) {
      return;
    }

    dismiss(walletAuthErrorToastId.value);
    walletAuthErrorToastId.value = null;
  };

  const closeDialog = () => {
    dismissWalletAuthErrorToast();
    walletAuthStore.closeDialog();
    options.open.value = false;
    void clearWalletAuthPopupQuery();
  };

  const handlePrimaryClick = async () => {
    dismissWalletAuthErrorToast();

    await sharedFlow.submitCurrentStep({
      onSuccess: closeDialog,
    });
  };

  watch(options.open, (isOpen) => {
    if (!isOpen) {
      if (isDialogWalletAuthOpen.value) {
        walletAuthStore.closeDialog();
      }

      void clearWalletAuthPopupQuery();
    }
  });

  watch(isDialogWalletAuthOpen, (isOpen) => {
    options.open.value = isOpen;
  }, { immediate: true });

  watch(shouldKeepWalletAuthPrompt, (shouldKeepPrompt) => {
    if (shouldKeepPrompt || route.query.popup !== 'wallet-auth') {
      return;
    }

    closeDialog();
  }, { immediate: true });

  watch(
    () => currentProfileState.value.errorMessage,
    (errorMessage, previousErrorMessage) => {
      if (!errorMessage || errorMessage === previousErrorMessage || !options.open.value) {
        return;
      }

      const { id } = toast({
        title: 'Wallet Setup Needs Attention',
        description: errorMessage,
        variant: 'error',
      });
      walletAuthErrorToastId.value = id;
      walletAuthStore.clearCurrentError();
    },
  );

  return {
    codeValue: sharedFlow.codeValue,
    isBusy: sharedFlow.isBusy,
    isCodeStep: sharedFlow.isCodeStep,
    isOtpStep: sharedFlow.isOtpStep,
    isMfaStep: sharedFlow.isMfaStep,
    isSuccessStep: sharedFlow.isSuccessStep,
    isErrorStep: sharedFlow.isErrorStep,
    dialogTitle: 'Confirm Transaction',
    stepDescription: sharedFlow.description,
    inputLabel: sharedFlow.inputLabel,
    inputPlaceholder: sharedFlow.inputPlaceholder,
    inputHelperText: sharedFlow.inputHelperText,
    primaryButtonText: sharedFlow.submitButtonText,
    isPrimaryDisabled: sharedFlow.isSubmitDisabled,
    closeDialog,
    handlePrimaryClick,
  };
}
