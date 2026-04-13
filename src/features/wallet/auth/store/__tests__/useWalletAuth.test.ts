import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useWalletAuth } from '../useWalletAuth';

const {
  dialogsStore,
  profilesRepository,
  evmRepository,
  walletAuthAdapter,
} = vi.hoisted(() => ({
  dialogsStore: {
    openWalletAuthDialog: vi.fn(),
    closeWalletAuthDialog: vi.fn(),
  },
  profilesRepository: {
    getProfileById: vi.fn(),
  },
  evmRepository: {
    registerWallet: vi.fn(),
    getEvmWalletByProfile: vi.fn(),
    updateWalletMfa: vi.fn(),
  },
  walletAuthAdapter: {
    startEmailOtp: vi.fn(),
    submitOtp: vi.fn(),
    submitMfa: vi.fn(),
    resetSession: vi.fn(),
    hasActiveSession: vi.fn(),
    getAuthDetails: vi.fn(),
    getStampedWhoamiRequest: vi.fn(),
    warmSignerWithZeroTransaction: vi.fn(),
    sendZeroTransaction: vi.fn(),
  },
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => profilesRepository,
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => evmRepository,
}));

vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: () => dialogsStore,
}));

vi.mock('InvestCommon/features/wallet/logic/walletAuth.adapter', () => ({
  walletAuthAdapter,
}));

vi.mock('InvestCommon/data/wallet/walletAuth.adapter', () => ({
  walletAuthAdapter,
}));

describe('useWalletAuth', () => {
  const createDeferred = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return {
      promise,
      resolve,
      reject,
    };
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.localStorage.clear();
    profilesRepository.getProfileById.mockResolvedValue(undefined);
    evmRepository.registerWallet.mockResolvedValue(undefined);
    evmRepository.getEvmWalletByProfile.mockResolvedValue(undefined);
    evmRepository.updateWalletMfa.mockResolvedValue(undefined);
    walletAuthAdapter.startEmailOtp.mockResolvedValue('awaiting_otp');
    walletAuthAdapter.submitOtp.mockResolvedValue('connected');
    walletAuthAdapter.submitMfa.mockResolvedValue(undefined);
    walletAuthAdapter.resetSession.mockResolvedValue(undefined);
    walletAuthAdapter.hasActiveSession.mockResolvedValue(true);
    walletAuthAdapter.getAuthDetails.mockResolvedValue({ address: '0xabc123' });
    walletAuthAdapter.getStampedWhoamiRequest.mockResolvedValue({ stamped: 'payload' });
    walletAuthAdapter.warmSignerWithZeroTransaction.mockResolvedValue(undefined);
    walletAuthAdapter.sendZeroTransaction.mockResolvedValue(undefined);
  });

  it('keeps the intro step and stores an error when the OTP email cannot be started', async () => {
    walletAuthAdapter.startEmailOtp.mockRejectedValueOnce(new Error('Failed to send OTP.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(store.currentProfileState.step).toBe('intro');
    expect(store.currentProfileState.errorMessage).toBe('Failed to send OTP.');
  });

  it('extracts the SDK message when starting OTP fails with a nested error payload', async () => {
    walletAuthAdapter.startEmailOtp.mockRejectedValueOnce({
      error: '{"code":3,"message":"Max number of OTPs have been initiated please wait and try again","details":[{"@type":"type.googleapis.com/errors.v1.TurnkeyErrorDetail","turnkeyErrorCode":"MAX_OTP_INITIATED"}],"turnkeyErrorCode":"MAX_OTP_INITIATED"}',
    });
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(store.currentProfileState.step).toBe('intro');
    expect(store.currentProfileState.errorMessage).toBe(
      'Max number of OTPs have been initiated please wait and try again',
    );
  });

  it('moves into MFA step without binding when OTP requires MFA', async () => {
    walletAuthAdapter.startEmailOtp.mockResolvedValueOnce('awaiting_mfa');
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    expect(store.currentProfileState.step).toBe('awaiting_mfa');
    expect(evmRepository.registerWallet).not.toHaveBeenCalled();
  });

  it('can start the wallet auth page flow without opening the dialog', async () => {
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    }, {
      openDialog: false,
    });

    expect(store.isDialogWalletAuthOpen).toBe(false);
    expect(dialogsStore.openWalletAuthDialog).not.toHaveBeenCalled();
    expect(store.currentProfileState.step).toBe('awaiting_otp');
  });

  it('can prepare page state without sending a new OTP', () => {
    const store = useWalletAuth();

    store.prepareFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(walletAuthAdapter.startEmailOtp).not.toHaveBeenCalled();
    expect(store.currentProfileId).toBe(7);
    expect(store.currentProfileState.step).toBe('intro');
    expect(store.currentProfileState.email).toBe('user@example.com');
  });

  it('clears a stale error when preparing the flow for the same profile again', async () => {
    walletAuthAdapter.startEmailOtp.mockRejectedValueOnce(new Error('Failed to send OTP.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(store.currentProfileState.errorMessage).toBe('Failed to send OTP.');

    store.prepareFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(store.currentProfileState.errorMessage).toBe('');
    expect(store.currentProfileState.email).toBe('user@example.com');
  });

  it('keeps the OTP step visible when OTP verification fails', async () => {
    walletAuthAdapter.submitOtp.mockRejectedValueOnce(new Error('Invalid OTP.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(store.currentProfileState.step).toBe('awaiting_otp');
    expect(store.currentProfileState.errorMessage).toBe('Invalid OTP.');
  });

  it('clears a stale OTP error as soon as a new verification request starts', async () => {
    const deferredSubmitOtp = createDeferred<'connected'>();
    walletAuthAdapter.submitOtp
      .mockRejectedValueOnce(new Error('Invalid OTP.'))
      .mockImplementationOnce(() => deferredSubmitOtp.promise);
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(store.currentProfileState.errorMessage).toBe('Invalid OTP.');

    const retryPromise = store.submitOtp('654321');

    expect(store.currentProfileState.step).toBe('sending_otp');
    expect(store.currentProfileState.errorMessage).toBe('');

    deferredSubmitOtp.resolve('connected');
    await retryPromise;
  });

  it('keeps the MFA step visible when authenticator verification fails', async () => {
    walletAuthAdapter.submitOtp.mockResolvedValueOnce('awaiting_mfa');
    walletAuthAdapter.submitMfa.mockRejectedValueOnce(new Error('Invalid authenticator code.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');
    await store.submitMfa('654321');

    expect(store.currentProfileState.step).toBe('awaiting_mfa');
    expect(store.currentProfileState.errorMessage).toBe('Invalid authenticator code.');
  });

  it('clears a stale MFA error as soon as a new verification request starts', async () => {
    const deferredSubmitMfa = createDeferred<void>();
    walletAuthAdapter.submitOtp.mockResolvedValueOnce('awaiting_mfa');
    walletAuthAdapter.submitMfa
      .mockRejectedValueOnce(new Error('Invalid authenticator code.'))
      .mockImplementationOnce(() => deferredSubmitMfa.promise);
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');
    await store.submitMfa('654321');

    expect(store.currentProfileState.step).toBe('awaiting_mfa');
    expect(store.currentProfileState.errorMessage).toBe('Invalid authenticator code.');

    const retryPromise = store.submitMfa('123456');

    expect(store.currentProfileState.step).toBe('awaiting_mfa');
    expect(store.currentProfileState.errorMessage).toBe('');

    deferredSubmitMfa.resolve();
    await retryPromise;
  });

  it('binds the wallet with stamped whoami payload after OTP auth completes', async () => {
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(walletAuthAdapter.getStampedWhoamiRequest).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.warmSignerWithZeroTransaction).toHaveBeenCalledTimes(1);
    expect(evmRepository.registerWallet).toHaveBeenCalledWith(7, {
      profile_id: 7,
      provider_name: 'alchemy',
      wallet_address: '0xabc123',
      stamped_whoami_request: { stamped: 'payload' },
    });
    expect(profilesRepository.getProfileById).toHaveBeenCalledWith('individual', 7);
    expect(evmRepository.getEvmWalletByProfile).toHaveBeenCalledWith(7, []);
    expect(store.currentProfileState.step).toBe('success');
  });

  it('binds immediately when the signer session is already connected', async () => {
    walletAuthAdapter.startEmailOtp.mockResolvedValueOnce('connected');
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    expect(walletAuthAdapter.warmSignerWithZeroTransaction).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.getStampedWhoamiRequest).toHaveBeenCalledTimes(1);
    expect(evmRepository.registerWallet).toHaveBeenCalledWith(7, {
      profile_id: 7,
      provider_name: 'alchemy',
      wallet_address: '0xabc123',
      stamped_whoami_request: { stamped: 'payload' },
    });
    expect(store.currentProfileState.step).toBe('success');
  });

  it('returns to MFA step when wallet address is missing during bind', async () => {
    walletAuthAdapter.submitOtp.mockResolvedValueOnce('awaiting_mfa');
    walletAuthAdapter.getAuthDetails.mockResolvedValueOnce({});
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');
    await store.submitMfa('654321');

    expect(store.currentProfileState.step).toBe('error');
    expect(store.currentProfileState.errorMessage).toBe('Wallet auth succeeded, but the wallet address is missing.');
  });

  it('keeps bind failures in a retryable error step after OTP auth succeeds', async () => {
    evmRepository.registerWallet.mockRejectedValueOnce(new Error('Temporary backend issue.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(store.currentProfileState.step).toBe('error');
    expect(store.currentProfileState.errorMessage).toBe('Temporary backend issue.');
  });

  it('retries from the error step by restarting email OTP auth', async () => {
    evmRepository.registerWallet
      .mockRejectedValueOnce(new Error('Temporary backend issue.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');
    await store.retryCurrentStep();

    expect(walletAuthAdapter.submitOtp).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.startEmailOtp).toHaveBeenCalledTimes(2);
    expect(evmRepository.registerWallet).toHaveBeenCalledTimes(1);
    expect(store.currentProfileState.step).toBe('awaiting_otp');
  });

  it('clears the current error when the dialog closes', async () => {
    walletAuthAdapter.startEmailOtp.mockRejectedValueOnce(new Error('Failed to send OTP.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    store.closeDialog();

    expect(store.currentProfileState.errorMessage).toBe('');
  });

  it('runs the pending post-auth action after wallet bind succeeds', async () => {
    const pendingAction = vi.fn().mockResolvedValue(undefined);
    const store = useWalletAuth();

    store.setPendingPostAuthAction({
      profileId: 7,
      run: pendingAction,
    });

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(dialogsStore.closeWalletAuthDialog).toHaveBeenCalledTimes(1);
    expect(pendingAction).toHaveBeenCalledTimes(1);
    expect(store.pendingPostAuthAction).toBeNull();
  });

  it('keeps the deferred post-auth action and runs it after a wrong otp is corrected', async () => {
    const pendingAction = vi.fn().mockResolvedValue(undefined);
    walletAuthAdapter.submitOtp
      .mockRejectedValueOnce(new Error('Invalid OTP.'))
      .mockResolvedValueOnce('connected');
    const store = useWalletAuth();

    store.setPendingPostAuthAction({
      profileId: 7,
      run: pendingAction,
    });

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });

    await store.submitOtp('000000');

    expect(store.currentProfileState.step).toBe('awaiting_otp');
    expect(store.pendingPostAuthAction).toEqual({
      profileId: 7,
      run: pendingAction,
    });

    await store.submitOtp('123456');

    expect(dialogsStore.closeWalletAuthDialog).toHaveBeenCalledTimes(1);
    expect(pendingAction).toHaveBeenCalledTimes(1);
    expect(store.pendingPostAuthAction).toBeNull();
  });

  it('clears any pending post-auth action when the dialog closes', () => {
    const store = useWalletAuth();

    store.setPendingPostAuthAction({
      profileId: 7,
      run: vi.fn().mockResolvedValue(undefined),
    });

    store.openDialog(7);
    store.closeDialog();

    expect(store.pendingPostAuthAction).toBeNull();
  });

  it('triggers the manual zero transaction warmup immediately when the session is active', async () => {
    const store = useWalletAuth();

    await expect(store.triggerZeroTransactionWarmup({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    })).resolves.toBe('completed');

    expect(walletAuthAdapter.hasActiveSession).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.sendZeroTransaction).toHaveBeenCalledTimes(1);
  });

  it('starts wallet auth and defers the zero transaction when the signer session is not active', async () => {
    walletAuthAdapter.hasActiveSession.mockResolvedValueOnce(false);
    const store = useWalletAuth();

    await expect(store.triggerZeroTransactionWarmup({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    })).resolves.toBe('deferred_to_wallet_auth');

    expect(walletAuthAdapter.hasActiveSession).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.startEmailOtp).toHaveBeenCalledTimes(1);
    expect(walletAuthAdapter.sendZeroTransaction).not.toHaveBeenCalled();
    expect(store.pendingPostAuthAction).toEqual({
      profileId: 7,
      run: expect.any(Function),
      successMarker: 'zero_transaction_warmup',
    });
  });

  it('marks the deferred zero transaction warmup as completed after wallet bind succeeds', async () => {
    walletAuthAdapter.hasActiveSession.mockResolvedValueOnce(false);
    const store = useWalletAuth();

    await store.triggerZeroTransactionWarmup({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    expect(walletAuthAdapter.sendZeroTransaction).toHaveBeenCalledTimes(1);
    expect(store.completedPostAuthAction).toBe('zero_transaction_warmup');
  });

  it('retries with the current session email instead of stale stored email', async () => {
    walletAuthAdapter.startEmailOtp.mockRejectedValueOnce(new Error('Failed to send OTP.'));
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'old@example.com',
    });

    walletAuthAdapter.startEmailOtp.mockResolvedValueOnce('awaiting_otp');
    await store.retryCurrentStep({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'new@example.com',
    });

    expect(walletAuthAdapter.startEmailOtp).toHaveBeenLastCalledWith('new@example.com');
    expect(store.currentProfileState.email).toBe('new@example.com');
  });

  it('resets wallet-auth state to intro when reopening after KYC', async () => {
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'old@example.com',
    });

    await store.maybeOpenAfterKyc({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'new@example.com',
      isKycApproved: true,
      walletStatus: '',
    });

    expect(store.currentProfileState.step).toBe('intro');
    expect(store.currentProfileState.email).toBe('new@example.com');
  });

  it('clears persisted wallet-auth state and signer session on reset', async () => {
    const store = useWalletAuth();

    walletAuthAdapter.hasActiveSession.mockResolvedValueOnce(false);
    await store.triggerZeroTransactionWarmup({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');

    await store.resetAll();

    expect(store.currentProfileId).toBeNull();
    expect(store.isDialogWalletAuthOpen).toBe(false);
    expect(store.pendingPostAuthAction).toBeNull();
    expect(store.completedPostAuthAction).toBeNull();
    expect(store.getProfileState(7)).toEqual({
      step: 'intro',
      email: '',
      errorMessage: '',
      lastOpenedAt: null,
      profileType: '',
    });
    expect(walletAuthAdapter.resetSession).toHaveBeenCalledTimes(1);
  });
});
