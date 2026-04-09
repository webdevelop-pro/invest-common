import {
  computed,
  ref,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { walletAuthAdapter } from 'InvestCommon/features/wallet/logic/walletAuth.adapter';
import {
  deriveWalletAuthEmail,
  shouldPromptWalletAuth,
} from 'InvestCommon/features/wallet/logic/walletAuth.helpers';

export type WalletAuthStep =
  | 'intro'
  | 'sending_otp'
  | 'awaiting_otp'
  | 'awaiting_mfa'
  | 'binding'
  | 'success'
  | 'error';

type WalletAuthProfileState = {
  step: WalletAuthStep;
  email: string;
  errorMessage: string;
  lastOpenedAt: number | null;
  profileType: string;
  retryAction: 'start' | 'bind' | 'finalize_after_mfa';
};

const getWalletAddressFromAuthDetails = (authDetails: unknown) => {
  const address = (authDetails as { address?: unknown } | null | undefined)?.address;
  return typeof address === 'string' && address ? address : '';
};

type OpenPayload = {
  profileId: number;
  profileType?: string | null;
  profileName?: string | null;
  fullAccountName?: string | null;
  userEmail?: string | null;
  walletStatus?: string | null;
  isKycApproved?: boolean | null;
};

const STORAGE_KEY = 'invest:wallet-auth:profiles';

const createEmptyState = (): WalletAuthProfileState => ({
  step: 'intro',
  email: '',
  errorMessage: '',
  lastOpenedAt: null,
  profileType: '',
  retryAction: 'start',
});

const readStorage = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as Record<string, WalletAuthProfileState>;
  } catch {
    return {};
  }
};

const writeStorage = (data: Record<string, WalletAuthProfileState>) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures and keep in-memory flow working.
  }
};

export const useWalletAuth = defineStore('wallet-auth', () => {
  const isDialogWalletAuthOpen = ref(false);
  const currentProfileId = ref<number | null>(null);
  const profileStates = ref<Record<string, WalletAuthProfileState>>(readStorage());

  const profilesRepository = useRepositoryProfiles();
  const evmRepository = useRepositoryEvm();
  const dialogsStore = useDialogs();

  watch(profileStates, (value) => {
    writeStorage(value);
  }, { deep: true });

  const currentProfileState = computed<WalletAuthProfileState>(() => {
    const profileId = currentProfileId.value;
    if (!profileId) {
      return createEmptyState();
    }

    return profileStates.value[String(profileId)] ?? createEmptyState();
  });

  const ensureProfileState = (profileId: number) => {
    const key = String(profileId);

    if (!profileStates.value[key]) {
      profileStates.value = {
        ...profileStates.value,
        [key]: createEmptyState(),
      };
    }

    return profileStates.value[key]!;
  };

  const patchProfileState = (profileId: number, patch: Partial<WalletAuthProfileState>) => {
    const previous = ensureProfileState(profileId);

    profileStates.value = {
      ...profileStates.value,
      [String(profileId)]: {
        ...previous,
        ...patch,
      },
    };
  };

  const setRetryableError = (
    profileId: number,
    error: unknown,
    retryAction: WalletAuthProfileState['retryAction'],
    fallbackMessage: string,
  ) => {
    patchProfileState(profileId, {
      step: 'error',
      errorMessage: (error as Error)?.message || fallbackMessage,
      retryAction,
    });
  };

  const openDialog = (profileId: number) => {
    currentProfileId.value = profileId;
    patchProfileState(profileId, {
      lastOpenedAt: Date.now(),
    });
    isDialogWalletAuthOpen.value = true;
    dialogsStore.openWalletAuthDialog();
  };

  const clearCurrentError = () => {
    const profileId = currentProfileId.value;
    if (!profileId || !currentProfileState.value.errorMessage) {
      return;
    }

    patchProfileState(profileId, {
      errorMessage: '',
    });
  };

  const closeDialog = () => {
    clearCurrentError();
    isDialogWalletAuthOpen.value = false;
    dialogsStore.closeWalletAuthDialog();
  };

  const clearProfileState = (profileId: number) => {
    const nextState = { ...profileStates.value };
    delete nextState[String(profileId)];
    profileStates.value = nextState;
  };

  const getProfileState = (profileId: number) => (
    profileStates.value[String(profileId)] ?? createEmptyState()
  );

  const hasResumableState = (profileId: number) => {
    const state = getProfileState(profileId);
    return ['awaiting_otp', 'awaiting_mfa', 'error'].includes(state.step);
  };

  const completeWalletBind = async (profileId: number) => {
    patchProfileState(profileId, {
      step: 'binding',
      errorMessage: '',
      retryAction: 'bind',
    });

    const authDetails = await walletAuthAdapter.getAuthDetails();
    const walletAddress = getWalletAddressFromAuthDetails(authDetails);
    if (!walletAddress) {
      throw new Error('Wallet auth succeeded, but the wallet address is missing.');
    }

    const stampedWhoamiRequest = await walletAuthAdapter.getStampedWhoamiRequest();
    await evmRepository.registerWallet(profileId, {
      profile_id: profileId,
      provider_name: 'alchemy',
      wallet_address: walletAddress,
      stamped_whoami_request: stampedWhoamiRequest,
    });
    await Promise.allSettled([
      profilesRepository.getProfileById(
        currentProfileState.value.profileType || PROFILE_TYPES.INDIVIDUAL,
        profileId,
      ),
      evmRepository.getEvmWalletByProfile(profileId, []),
    ]);

    patchProfileState(profileId, {
      step: 'success',
      errorMessage: '',
      retryAction: 'start',
    });
  };

  const finalizeAfterMfa = async (profileId: number) => {
    patchProfileState(profileId, {
      step: 'binding',
      errorMessage: '',
      retryAction: 'finalize_after_mfa',
    });

    await evmRepository.updateWalletMfa(profileId, {
      provider_name: 'alchemy',
      mfa_enabled: true,
    });
    await completeWalletBind(profileId);
  };

  const startEmailOtpFlow = async (
    profileId: number,
    email: string,
    profileType: string,
  ) => {
    openDialog(profileId);
    patchProfileState(profileId, {
      step: 'sending_otp',
      email,
      errorMessage: '',
      profileType,
      retryAction: 'start',
    });

    const nextStep = await walletAuthAdapter.startEmailOtp(email);

    if (nextStep === 'connected') {
      try {
        await completeWalletBind(profileId);
      } catch (error) {
        setRetryableError(
          profileId,
          error,
          'bind',
          'Wallet auth succeeded, but we could not finish wallet setup.',
        );
      }
      return;
    }

    patchProfileState(profileId, {
      step: nextStep,
      errorMessage: '',
      retryAction: 'start',
    });
  };

  const startFlowForProfile = async (payload: OpenPayload) => {
    const {
      profileId,
      profileType,
      profileName,
      fullAccountName,
      userEmail,
    } = payload;

    const isIndividual = profileType === PROFILE_TYPES.INDIVIDUAL;
    const email = deriveWalletAuthEmail(
      userEmail,
      profileName || fullAccountName,
      isIndividual,
    );

    if (!email) {
      patchProfileState(profileId, {
        step: 'intro',
        errorMessage: 'Wallet auth email is missing for this profile.',
      });
      openDialog(profileId);
      return;
    }

    try {
      await startEmailOtpFlow(profileId, email, profileType || '');
    } catch (error) {
      patchProfileState(profileId, {
        step: 'intro',
        email,
        errorMessage: (error as Error)?.message || 'Failed to send wallet verification code.',
        retryAction: 'start',
      });
    }
  };

  const submitOtp = async (otpCode: string) => {
    const profileId = currentProfileId.value;
    if (!profileId) {
      return;
    }

    patchProfileState(profileId, {
      step: 'sending_otp',
      errorMessage: '',
    });

    try {
      const result = await walletAuthAdapter.submitOtp(otpCode);
      if (result === 'awaiting_mfa') {
        patchProfileState(profileId, {
          step: 'awaiting_mfa',
          errorMessage: '',
          retryAction: 'start',
        });
        return;
      }

      try {
        await completeWalletBind(profileId);
      } catch (error) {
        setRetryableError(
          profileId,
          error,
          'bind',
          'Wallet auth succeeded, but we could not finish wallet setup.',
        );
      }
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to verify the wallet code.';
      patchProfileState(profileId, {
        step: 'awaiting_otp',
        errorMessage: message,
        retryAction: 'start',
      });
    }
  };

  const submitMfa = async (code: string) => {
    const profileId = currentProfileId.value;
    if (!profileId) {
      return;
    }

    try {
      await walletAuthAdapter.submitMfa(code);
    } catch (error) {
      patchProfileState(profileId, {
        step: 'awaiting_mfa',
        errorMessage: (error as Error)?.message || 'Failed to verify the authenticator code.',
        retryAction: 'start',
      });
      return;
    }

    try {
      await finalizeAfterMfa(profileId);
    } catch (error) {
      setRetryableError(
        profileId,
        error,
        'finalize_after_mfa',
        'Wallet auth succeeded, but we could not finish wallet setup.',
      );
    }
  };

  const retryCurrentStep = async () => {
    const profileId = currentProfileId.value;
    if (!profileId) {
      return;
    }

    const state = currentProfileState.value;

    try {
      if (state.retryAction === 'bind') {
        await completeWalletBind(profileId);
        return;
      }

      if (state.retryAction === 'finalize_after_mfa') {
        await finalizeAfterMfa(profileId);
        return;
      }

      if (!state.email) {
        patchProfileState(profileId, {
          step: 'intro',
          errorMessage: 'Wallet auth email is missing for this profile.',
          retryAction: 'start',
        });
        return;
      }

      await startEmailOtpFlow(profileId, state.email, state.profileType || '');
    } catch (error) {
      setRetryableError(
        profileId,
        error,
        state.retryAction,
        'Wallet setup could not be completed.',
      );
    }
  };

  const maybeOpenAfterKyc = async (payload: OpenPayload) => {
    if (!shouldPromptWalletAuth(payload)) {
      return;
    }

    const existingState = getProfileState(payload.profileId);
    openDialog(payload.profileId);

    if (existingState.step === 'awaiting_otp'
      || existingState.step === 'awaiting_mfa'
      || existingState.step === 'error') {
      return;
    }

    patchProfileState(payload.profileId, {
      step: 'intro',
      email: deriveWalletAuthEmail(
        payload.userEmail,
        payload.profileName || payload.fullAccountName,
        payload.profileType === PROFILE_TYPES.INDIVIDUAL,
      ),
      errorMessage: '',
      profileType: payload.profileType || '',
      retryAction: 'start',
    });
  };

  return {
    isDialogWalletAuthOpen,
    currentProfileId,
    currentProfileState,
    openDialog,
    closeDialog,
    getProfileState,
    hasResumableState,
    clearProfileState,
    clearCurrentError,
    startFlowForProfile,
    submitOtp,
    submitMfa,
    retryCurrentStep,
    maybeOpenAfterKyc,
  };
});

if (import.meta.hot && import.meta.env.MODE !== 'test' && !import.meta.vitest) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletAuth, import.meta.hot));
}
