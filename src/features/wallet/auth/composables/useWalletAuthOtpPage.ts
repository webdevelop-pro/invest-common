import {
  computed,
  shallowRef,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useWalletAuthSharedFlow } from './useWalletAuthSharedFlow';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useWalletAuth } from 'InvestCommon/features/wallet/auth/store/useWalletAuth';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import {
  ROUTE_DASHBOARD_ACCOUNT,
} from 'InvestCommon/domain/config/enums/routes';

export function useWalletAuthOtpPage() {
  useGlobalLoader().hide();

  const route = useRoute();
  const router = useRouter();
  const walletAuthStore = useWalletAuth();
  const profilesStore = useProfilesStore();
  const { toast, dismiss } = useToast();
  const sharedFlow = useWalletAuthSharedFlow();
  const { currentProfileState } = storeToRefs(walletAuthStore);
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const { completedPostAuthAction } = storeToRefs(walletAuthStore);
  const walletAuthErrorToastId = shallowRef<string | null>(null);

  const routeProfileId = computed(() => {
    const value = Number(route.params.profileId);
    return Number.isNaN(value) ? 0 : value;
  });

  const profileId = computed(() => (
    routeProfileId.value > 0
      ? routeProfileId.value
      : Number(selectedUserProfileId.value ?? 0)
  ));

  const postWalletAuthSuccessRoute = computed(() => ({
    name: ROUTE_DASHBOARD_ACCOUNT,
    params: {
      profileId: profileId.value,
    },
  }));

  const dismissWalletAuthErrorToast = () => {
    if (!walletAuthErrorToastId.value) {
      return;
    }

    dismiss(walletAuthErrorToastId.value);
    walletAuthErrorToastId.value = null;
  };

  const retry = async () => {
    dismissWalletAuthErrorToast();
    await sharedFlow.retry();
  };

  const submitCurrentStep = async () => {
    dismissWalletAuthErrorToast();
    await sharedFlow.submitCurrentStep();
  };

  const startWalletAuthFlow = async () => {
    await sharedFlow.ensureWalletAuthFlow(profileId.value, {
      openDialog: false,
      startIfMissing: true,
    });
  };

  watch(profileId, async () => {
    await startWalletAuthFlow();
  }, { immediate: true });

  watch(sharedFlow.isSuccessStep, async (isSuccess) => {
    if (!isSuccess) {
      return;
    }

    if (completedPostAuthAction.value === 'zero_transaction_warmup') {
      toast({
        title: 'Zero Transaction Sent',
        description: 'Your wallet is ready.',
      });
      walletAuthStore.clearCompletedPostAuthAction();
    } else {
      toast({
        title: 'Wallet Connected',
        description: 'Your wallet authentication is complete.',
        variant: 'success',
      });
    }

    await router.push(postWalletAuthSuccessRoute.value);
  });

  watch(
    () => currentProfileState.value.errorMessage,
    (errorMessage, previousErrorMessage) => {
      if (!errorMessage || errorMessage === previousErrorMessage) {
        return;
      }

      const { id } = toast({
        title: 'Wallet Setup Needs Attention',
        description: errorMessage,
        variant: 'error',
      });
      walletAuthErrorToastId.value = id;

      if (currentProfileState.value.step !== 'error') {
        walletAuthStore.clearCurrentError();
      }
    },
  );

  return {
    title: sharedFlow.title,
    codeValue: sharedFlow.codeValue,
    description: sharedFlow.description,
    inputLabel: sharedFlow.inputLabel,
    inputPlaceholder: sharedFlow.inputPlaceholder,
    inputHelperText: sharedFlow.inputHelperText,
    submitButtonText: sharedFlow.submitButtonText,
    isBusy: sharedFlow.isBusy,
    isOtpStep: sharedFlow.isOtpStep,
    isMfaStep: sharedFlow.isMfaStep,
    isErrorStep: sharedFlow.isErrorStep,
    isSubmitDisabled: sharedFlow.isSubmitDisabled,
    retry,
    submitCurrentStep,
  };
}
