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

describe('useWalletAuth', () => {
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

  it('retries wallet bind from the error step without asking for OTP again', async () => {
    evmRepository.registerWallet
      .mockRejectedValueOnce(new Error('Temporary backend issue.'))
      .mockResolvedValueOnce(undefined);
    const store = useWalletAuth();

    await store.startFlowForProfile({
      profileId: 7,
      profileType: 'individual',
      userEmail: 'user@example.com',
    });
    await store.submitOtp('123456');
    await store.retryCurrentStep();

    expect(walletAuthAdapter.submitOtp).toHaveBeenCalledTimes(1);
    expect(evmRepository.registerWallet).toHaveBeenCalledTimes(2);
    expect(store.currentProfileState.step).toBe('success');
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
    });
  });
});
