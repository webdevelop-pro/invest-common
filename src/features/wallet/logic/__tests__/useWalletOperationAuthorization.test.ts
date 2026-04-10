import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useWalletOperationAuthorization } from '../useWalletOperationAuthorization';

const hoisted = vi.hoisted(() => ({
  authorizeWithdrawStart: vi.fn(),
  authorizeWithdrawConfirm: vi.fn(),
  getAuthorizeSessions: vi.fn(),
  startFlowForProfile: vi.fn(),
  setPendingPostAuthAction: vi.fn(),
  hasActiveSession: vi.fn(),
  signAuthorizationRequest: vi.fn(),
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    authorizeWithdrawStart: hoisted.authorizeWithdrawStart,
    authorizeWithdrawConfirm: hoisted.authorizeWithdrawConfirm,
    getAuthorizeSessions: hoisted.getAuthorizeSessions,
  }),
}));

vi.mock('InvestCommon/features/wallet/store/useWalletAuth', async () => {
  const actual = await vi.importActual('InvestCommon/features/wallet/store/useWalletAuth');

  return {
    ...actual,
    useWalletAuth: () => ({
      startFlowForProfile: hoisted.startFlowForProfile,
      setPendingPostAuthAction: hoisted.setPendingPostAuthAction,
    }),
  };
});

vi.mock('InvestCommon/features/wallet/logic/walletAuth.adapter', () => ({
  walletAuthAdapter: {
    hasActiveSession: hoisted.hasActiveSession,
    signAuthorizationRequest: hoisted.signAuthorizationRequest,
  },
}));

describe('useWalletOperationAuthorization', () => {
  const request = {
    chain: 'ethereum',
    asset_address: '0xusdc',
    max_amount: '10',
    nonce: 'wdr_test_0001',
  };

  const walletAuthContext = {
    profileId: 7,
    profileType: 'individual',
    userEmail: 'user@example.com',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.authorizeWithdrawStart.mockReset();
    hoisted.authorizeWithdrawStart.mockResolvedValue({
      session_id: 'session_confirm_1',
      signature_request: {
        type: 'eth_signTypedData_v4',
        data: { hello: 'world' },
      },
    });
    hoisted.authorizeWithdrawConfirm.mockReset();
    hoisted.authorizeWithdrawConfirm.mockResolvedValue({
      profile_id: 7,
      session_id: 'session_confirm_1',
      authorization_status: 'active',
    });
    hoisted.getAuthorizeSessions.mockReset();
    hoisted.getAuthorizeSessions.mockResolvedValue([]);
    hoisted.hasActiveSession.mockReset();
    hoisted.hasActiveSession.mockResolvedValue(true);
    hoisted.signAuthorizationRequest.mockReset();
    hoisted.signAuthorizationRequest.mockResolvedValue('0xsigned');
    hoisted.startFlowForProfile.mockReset();
    hoisted.startFlowForProfile.mockResolvedValue(undefined);
    hoisted.setPendingPostAuthAction.mockReset();
  });

  it('completes authorize-start, sign, and confirm for a wallet operation', async () => {
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
    });

    expect(result).toEqual({
      status: 'authorized',
      data: {
        profile_id: 7,
        session_id: 'session_confirm_1',
        authorization_status: 'active',
      },
    });
    expect(hoisted.getAuthorizeSessions).toHaveBeenCalledWith(7, {
      assetAddress: '0xusdc',
      chain: 'ethereum',
      status: 'active',
    });
    expect(hoisted.authorizeWithdrawStart).toHaveBeenCalledWith(7, request);
    expect(hoisted.signAuthorizationRequest).toHaveBeenCalledWith({
      type: 'eth_signTypedData_v4',
      data: { hello: 'world' },
    });
    expect(hoisted.authorizeWithdrawConfirm).toHaveBeenCalledWith(7, {
      session_id: 'session_confirm_1',
      owner_signature: '0xsigned',
    });
  });

  it('reuses an active backend authorization session for the same token', async () => {
    hoisted.getAuthorizeSessions.mockResolvedValueOnce([
      {
        profile_id: 7,
        wallet_address: '0xwallet',
        session_id: 'session_reused_1',
        chain: 'ethereum',
        asset: '0xusdc',
        max_amount: '10',
        remaining_amount: '7',
        issued_at: '2026-04-10T08:00:00.000Z',
        expires_at: '2099-04-10T09:00:00.000Z',
        authorization_status: 'active',
      },
    ]);
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
    });

    expect(result).toEqual({
      status: 'authorized',
      data: {
        profile_id: 7,
        session_id: 'session_reused_1',
        authorization_status: 'active',
      },
    });
    expect(hoisted.getAuthorizeSessions).toHaveBeenCalledWith(7, {
      assetAddress: '0xusdc',
      chain: 'ethereum',
      status: 'active',
    });
    expect(hoisted.hasActiveSession).not.toHaveBeenCalled();
    expect(hoisted.authorizeWithdrawStart).not.toHaveBeenCalled();
    expect(hoisted.signAuthorizationRequest).not.toHaveBeenCalled();
    expect(hoisted.authorizeWithdrawConfirm).not.toHaveBeenCalled();
  });

  it('defers to wallet auth when signing requires re-authentication', async () => {
    const onAuthRecovered = vi.fn().mockResolvedValue(undefined);
    const onBeforeWalletAuth = vi.fn();
    hoisted.signAuthorizationRequest.mockRejectedValueOnce({
      name: 'NotAuthenticatedError',
      message: 'Signer not authenticated. Please authenticate to use this signer',
    });
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
      onBeforeWalletAuth,
      onAuthRecovered,
    });

    expect(result).toEqual({
      status: 'deferred_to_wallet_auth',
    });
    expect(hoisted.setPendingPostAuthAction).toHaveBeenCalledTimes(1);
    expect(hoisted.setPendingPostAuthAction.mock.calls[0]?.[0]).toEqual({
      profileId: 7,
      run: onAuthRecovered,
    });
    expect(onBeforeWalletAuth).toHaveBeenCalledTimes(1);
    expect(hoisted.startFlowForProfile).toHaveBeenCalledWith(walletAuthContext);
    expect(hoisted.authorizeWithdrawConfirm).not.toHaveBeenCalled();
  });

  it('defers to wallet auth before authorize/start when there is no active signer session', async () => {
    const onAuthRecovered = vi.fn().mockResolvedValue(undefined);
    const onBeforeWalletAuth = vi.fn();
    hoisted.hasActiveSession.mockResolvedValueOnce(false);
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
      onBeforeWalletAuth,
      onAuthRecovered,
    });

    expect(result).toEqual({
      status: 'deferred_to_wallet_auth',
    });
    expect(hoisted.setPendingPostAuthAction).toHaveBeenCalledWith({
      profileId: 7,
      run: onAuthRecovered,
    });
    expect(onBeforeWalletAuth).toHaveBeenCalledTimes(1);
    expect(hoisted.startFlowForProfile).toHaveBeenCalledWith(walletAuthContext);
    expect(hoisted.authorizeWithdrawStart).not.toHaveBeenCalled();
    expect(hoisted.signAuthorizationRequest).not.toHaveBeenCalled();
  });

  it('stops the flow when the user rejects signing', async () => {
    hoisted.signAuthorizationRequest.mockRejectedValueOnce(new Error('User rejected the request.'));
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
    });

    expect(result.status).toBe('cancelled');
    expect(hoisted.startFlowForProfile).not.toHaveBeenCalled();
    expect(hoisted.authorizeWithdrawConfirm).not.toHaveBeenCalled();
  });

  it('returns an error result when confirm fails', async () => {
    hoisted.authorizeWithdrawConfirm.mockRejectedValueOnce(new Error('Confirm failed.'));
    const { authorizeOperation } = useWalletOperationAuthorization();

    const result = await authorizeOperation({
      profileId: 7,
      request,
      walletAuthContext,
    });

    expect(result).toEqual({
      status: 'error',
      error: new Error('Confirm failed.'),
    });
  });
});
