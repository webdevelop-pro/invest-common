import {
  computed,
  ref,
} from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { walletAuthAdapter } from 'InvestCommon/data/wallet/walletAuth.adapter';
import {
  deriveWalletAuthEmail,
  resolveWalletAuthErrorMessage,
  shouldPromptWalletAuth,
} from 'InvestCommon/features/wallet/auth/logic/walletAuth.helpers';

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

export type WalletAuthOpenPayload = OpenPayload;

type StartFlowOptions = {
  openDialog?: boolean;
};

type PendingPostAuthAction = {
  profileId: number;
  run: () => Promise<void>;
  successMarker?: CompletedPostAuthAction;
};

export type TriggerZeroTransactionWarmupResult =
  | 'completed'
  | 'deferred_to_wallet_auth';

export type CompletedPostAuthAction =
  | 'zero_transaction_warmup';

const createEmptyState = (): WalletAuthProfileState => ({
  step: 'intro',
  email: '',
  errorMessage: '',
  lastOpenedAt: null,
  profileType: '',
});

const resolveWalletAuthEmail = (payload: OpenPayload) => deriveWalletAuthEmail(
  payload.userEmail,
  payload.profileName || payload.fullAccountName,
  payload.profileType === PROFILE_TYPES.INDIVIDUAL,
);

export const useWalletAuth = defineStore('wallet-auth', () => {
  const isDialogWalletAuthOpen = ref(false);
  const currentProfileId = ref<number | null>(null);
  const profileStates = ref<Record<string, WalletAuthProfileState>>({});
  const pendingPostAuthAction = ref<PendingPostAuthAction | null>(null);
  const completedPostAuthAction = ref<CompletedPostAuthAction | null>(null);

  const profilesRepository = useRepositoryProfiles();
  const evmRepository = useRepositoryEvm();
  const dialogsStore = useDialogs();

  const currentProfileState = computed<WalletAuthProfileState>(() => {
    const profileId = currentProfileId.value;
    if (profileId === null) {
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

  const patchStep = (
    profileId: number,
    step: WalletAuthStep,
    patch: Partial<WalletAuthProfileState> = {},
  ) => {
    patchProfileState(profileId, {
      step,
      ...patch,
    });
  };

  const clearProfileError = (profileId: number) => {
    if (!ensureProfileState(profileId).errorMessage) {
      return;
    }

    patchProfileState(profileId, {
      errorMessage: '',
    });
  };

  const setErrorStep = (
    profileId: number,
    error: unknown,
    fallbackMessage: string,
  ) => {
    patchProfileState(profileId, {
      step: 'error',
      errorMessage: resolveWalletAuthErrorMessage(error, fallbackMessage),
    });
  };

  const setBindingError = (profileId: number, error: unknown) => {
    setErrorStep(
      profileId,
      error,
      'Wallet auth succeeded, but we could not finish wallet setup.',
    );
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
    if (profileId === null || !currentProfileState.value.errorMessage) {
      return;
    }

    patchProfileState(profileId, {
      errorMessage: '',
    });
  };

  const clearPendingPostAuthAction = (profileId?: number) => {
    if (!pendingPostAuthAction.value) {
      return;
    }

    if (profileId !== undefined && pendingPostAuthAction.value.profileId !== profileId) {
      return;
    }

    pendingPostAuthAction.value = null;
  };

  const closeDialog = (options?: { clearPendingAction?: boolean }) => {
    clearCurrentError();
    if (options?.clearPendingAction !== false) {
      clearPendingPostAuthAction(currentProfileId.value ?? undefined);
    }
    isDialogWalletAuthOpen.value = false;
    dialogsStore.closeWalletAuthDialog();
  };

  const setCurrentProfile = (profileId: number | null) => {
    currentProfileId.value = profileId;
  };

  const setPendingPostAuthAction = (action: PendingPostAuthAction) => {
    completedPostAuthAction.value = null;
    pendingPostAuthAction.value = action;
  };

  const runPendingPostAuthAction = async (profileId: number) => {
    const action = pendingPostAuthAction.value;
    if (!action || action.profileId !== profileId) {
      return;
    }

    pendingPostAuthAction.value = null;

    try {
      await action.run();
      completedPostAuthAction.value = action.successMarker ?? null;
    } catch {
      // The caller that deferred the action is responsible for exposing its own errors.
    }
  };

  const clearCompletedPostAuthAction = () => {
    completedPostAuthAction.value = null;
  };

  const hasPendingPostAuthActionForProfile = (profileId: number) => (
    pendingPostAuthAction.value?.profileId === profileId
  );

  const clearProfileState = (profileId: number) => {
    const nextState = { ...profileStates.value };
    delete nextState[String(profileId)];
    profileStates.value = nextState;
  };

  const getProfileState = (profileId: number) => (
    profileStates.value[String(profileId)] ?? createEmptyState()
  );

  const prepareFlowForProfile = (payload: OpenPayload) => {
    const {
      profileId,
      profileType,
    } = payload;

    setCurrentProfile(profileId);
    clearProfileError(profileId);
    patchProfileState(profileId, {
      email: resolveWalletAuthEmail(payload),
      errorMessage: '',
      profileType: profileType || '',
    });
  };

  const completeWalletBind = async (profileId: number) => {
    patchStep(profileId, 'binding', {
      errorMessage: '',
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
    await walletAuthAdapter.warmSignerWithZeroTransaction();
    await Promise.allSettled([
      profilesRepository.getProfileById(
        currentProfileState.value.profileType || PROFILE_TYPES.INDIVIDUAL,
        profileId,
      ),
      evmRepository.getEvmWalletByProfile(profileId, []),
    ]);

    patchStep(profileId, 'success', {
      errorMessage: '',
    });
  };

  const resumePendingPostAuthAction = async (profileId: number) => {
    patchStep(profileId, 'success', {
      errorMessage: '',
    });
    closeDialog({ clearPendingAction: false });
    await runPendingPostAuthAction(profileId);
  };

  const finalizeAfterMfa = async (profileId: number) => {
    if (hasPendingPostAuthActionForProfile(profileId)) {
      await resumePendingPostAuthAction(profileId);
      return;
    }

    patchStep(profileId, 'binding', {
      errorMessage: '',
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
    patchStep(profileId, 'sending_otp', {
      email,
      errorMessage: '',
      profileType,
    });

    const nextStep = await walletAuthAdapter.startEmailOtp(email);

    if (nextStep === 'connected') {
      try {
        if (hasPendingPostAuthActionForProfile(profileId)) {
          await resumePendingPostAuthAction(profileId);
        } else {
          await completeWalletBind(profileId);
        }
      } catch (error) {
        setBindingError(profileId, error);
      }
      return;
    }

    patchStep(profileId, nextStep, {
      errorMessage: '',
    });
  };

  const resolveRetryEmail = (
    state: WalletAuthProfileState,
    payload?: Partial<OpenPayload>,
  ) => {
    if (!payload) {
      return state.email;
    }

    return resolveWalletAuthEmail({
      profileId: currentProfileId.value ?? 0,
      profileType: payload.profileType ?? state.profileType,
      profileName: payload.profileName,
      fullAccountName: payload.fullAccountName,
      userEmail: payload.userEmail,
    }) || state.email;
  };

  const startFlowForProfile = async (
    payload: OpenPayload,
    options: StartFlowOptions = {},
  ) => {
    const {
      profileId,
      profileType,
    } = payload;
    const email = resolveWalletAuthEmail(payload);
    const shouldOpenDialog = options.openDialog !== false;

    patchProfileState(profileId, {
      ...createEmptyState(),
      email,
      profileType: profileType || '',
    });
    setCurrentProfile(profileId);

    if (shouldOpenDialog) {
      openDialog(profileId);
    }

    if (!email) {
      patchStep(profileId, 'intro', {
        errorMessage: 'Wallet auth email is missing for this profile.',
      });
      return;
    }

    try {
      await startEmailOtpFlow(profileId, email, profileType || '');
    } catch (error) {
      patchStep(profileId, 'intro', {
        email,
        errorMessage: resolveWalletAuthErrorMessage(
          error,
          'Failed to send wallet verification code.',
        ),
      });
    }
  };

  const submitOtp = async (otpCode: string) => {
    const profileId = currentProfileId.value;
    if (profileId === null) {
      return;
    }

    clearProfileError(profileId);
    patchStep(profileId, 'sending_otp', {
      errorMessage: '',
    });

    try {
      const result = await walletAuthAdapter.submitOtp(otpCode);
      if (result === 'awaiting_mfa') {
        patchStep(profileId, 'awaiting_mfa', {
          errorMessage: '',
        });
        return;
      }

      try {
        if (hasPendingPostAuthActionForProfile(profileId)) {
          await resumePendingPostAuthAction(profileId);
        } else {
          await completeWalletBind(profileId);
        }
      } catch (error) {
        setBindingError(profileId, error);
      }
    } catch (error) {
      const message = resolveWalletAuthErrorMessage(
        error,
        'Failed to verify the wallet code.',
      );
      patchStep(profileId, 'awaiting_otp', {
        errorMessage: message,
      });
    }
  };

  const submitMfa = async (code: string) => {
    const profileId = currentProfileId.value;
    if (profileId === null) {
      return;
    }

    clearProfileError(profileId);
    try {
      await walletAuthAdapter.submitMfa(code);
    } catch (error) {
      patchStep(profileId, 'awaiting_mfa', {
        errorMessage: resolveWalletAuthErrorMessage(
          error,
          'Failed to verify the authenticator code.',
        ),
      });
      return;
    }

    try {
      await finalizeAfterMfa(profileId);
    } catch (error) {
      setErrorStep(
        profileId,
        error,
        'Wallet auth succeeded, but we could not finish wallet setup.',
      );
    }
  };

  const retryCurrentStep = async (payload?: Partial<OpenPayload>) => {
    const profileId = currentProfileId.value;
    if (profileId === null) {
      return;
    }

    const state = currentProfileState.value;
    const email = resolveRetryEmail(state, payload);

    if (!email) {
      patchStep(profileId, 'intro', {
        errorMessage: 'Wallet auth email is missing for this profile.',
      });
      return;
    }

    await startFlowForProfile({
      profileId,
      profileType: payload?.profileType ?? state.profileType,
      profileName: payload?.profileName,
      fullAccountName: payload?.fullAccountName,
      userEmail: payload?.userEmail ?? email,
    }, {
      openDialog: isDialogWalletAuthOpen.value,
    });
  };

  const triggerZeroTransactionWarmup = async (
    payload: OpenPayload,
  ): Promise<TriggerZeroTransactionWarmupResult> => {
    console.log('[walletAuthStore] triggerZeroTransactionWarmup:start', {
      profileId: payload.profileId,
      profileType: payload.profileType,
      walletStatus: payload.walletStatus,
      isKycApproved: payload.isKycApproved,
    });
    const hasActiveSession = await walletAuthAdapter.hasActiveSession();
    console.log('[walletAuthStore] triggerZeroTransactionWarmup:session', {
      profileId: payload.profileId,
      hasActiveSession,
    });

    if (hasActiveSession) {
      await walletAuthAdapter.sendZeroTransaction();
      console.log('[walletAuthStore] triggerZeroTransactionWarmup:completedImmediately', {
        profileId: payload.profileId,
      });
      return 'completed';
    }

    setPendingPostAuthAction({
      profileId: payload.profileId,
      successMarker: 'zero_transaction_warmup',
      run: async () => {
        console.log('[walletAuthStore] triggerZeroTransactionWarmup:resumePendingAction', {
          profileId: payload.profileId,
        });
        await walletAuthAdapter.sendZeroTransaction();
      },
    });
    console.log('[walletAuthStore] triggerZeroTransactionWarmup:deferredToAuth', {
      profileId: payload.profileId,
    });
    await startFlowForProfile(payload);

    return 'deferred_to_wallet_auth';
  };

  const maybeOpenAfterKyc = async (payload: OpenPayload) => {
    if (!shouldPromptWalletAuth(payload)) {
      return;
    }

    openDialog(payload.profileId);
    prepareFlowForProfile(payload);
    patchProfileState(payload.profileId, {
      step: 'intro',
      email: resolveWalletAuthEmail(payload),
      errorMessage: '',
      profileType: payload.profileType || '',
    });
  };

  const resetAll = async () => {
    closeDialog();
    currentProfileId.value = null;
    profileStates.value = {};
    pendingPostAuthAction.value = null;
    completedPostAuthAction.value = null;
    await walletAuthAdapter.resetSession();
  };

  return {
    isDialogWalletAuthOpen,
    currentProfileId,
    currentProfileState,
    setCurrentProfile,
    openDialog,
    closeDialog,
    pendingPostAuthAction,
    completedPostAuthAction,
    setPendingPostAuthAction,
    clearPendingPostAuthAction,
    clearCompletedPostAuthAction,
    getProfileState,
    clearProfileState,
    clearCurrentError,
    prepareFlowForProfile,
    startFlowForProfile,
    submitOtp,
    submitMfa,
    retryCurrentStep,
    triggerZeroTransactionWarmup,
    maybeOpenAfterKyc,
    resetAll,
  };
});

if (import.meta.hot && import.meta.env.MODE !== 'test' && !import.meta.vitest) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletAuth, import.meta.hot));
}
