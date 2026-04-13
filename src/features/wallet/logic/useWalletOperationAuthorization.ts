import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type {
  IEvmWalletAuthorizeSession,
  IEvmWalletAuthorizeConfirmResponse,
  IEvmWalletAuthorizeStartRequestBody,
} from 'InvestCommon/data/evm/evm.types';
import { useWalletAuth, type WalletAuthOpenPayload } from 'InvestCommon/features/wallet/auth/store/useWalletAuth';
import { walletAuthAdapter } from './walletAuth.adapter';
import {
  isRecoverableWalletAuthError,
  isUserRejectedWalletSignatureError,
} from './walletAuth.helpers';

export type WalletOperationAuthorizationRequest = IEvmWalletAuthorizeStartRequestBody;
export type WalletOperationAuthorizationContext = WalletAuthOpenPayload;

export type WalletOperationAuthorizationResult =
  | {
    status: 'authorized';
    data: IEvmWalletAuthorizeConfirmResponse;
  }
  | {
    status: 'deferred_to_wallet_auth';
  }
  | {
    status: 'cancelled';
    error: Error;
  }
  | {
    status: 'error';
    error: Error;
  };

type AuthorizeWalletOperationParams = {
  profileId: number;
  request: WalletOperationAuthorizationRequest;
  walletAuthContext: WalletOperationAuthorizationContext;
  onBeforeWalletAuth?: () => void | Promise<void>;
  onAuthRecovered?: () => Promise<void>;
};

const normalizeToken = (value: unknown) => String(value ?? '').trim().toLowerCase();

const isSessionExpired = (session: Pick<IEvmWalletAuthorizeSession, 'expires_at'>) => {
  const expiresAt = Date.parse(session.expires_at);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
};

const findReusableSession = (
  sessions: IEvmWalletAuthorizeSession[],
  request: WalletOperationAuthorizationRequest,
) => sessions.find((session) => (
  normalizeToken(session.authorization_status) === 'active'
  && !isSessionExpired(session)
  && normalizeToken(session.chain) === normalizeToken(request.chain)
  && normalizeToken(session.asset) === normalizeToken(request.asset_address)
));

const toError = (error: unknown) => (
  (() => {
    if (error instanceof Error) {
      return error;
    }

    const errorLike = error as { name?: unknown; message?: unknown } | null | undefined;
    const message = String(errorLike?.message ?? error ?? 'Wallet authorization failed.').trim();
    const normalizedError = new Error(message || 'Wallet authorization failed.');
    const errorName = String(errorLike?.name ?? '').trim();

    if (errorName) {
      normalizedError.name = errorName;
    }

    return normalizedError;
  })()
);

export function useWalletOperationAuthorization() {
  const evmRepository = useRepositoryEvm();
  const walletAuthStore = useWalletAuth();

  const deferToWalletAuth = async (
    profileId: number,
    walletAuthContext: WalletOperationAuthorizationContext,
    onBeforeWalletAuth?: () => void | Promise<void>,
    onAuthRecovered?: () => Promise<void>,
  ): Promise<WalletOperationAuthorizationResult> => {
    if (!onAuthRecovered) {
      return {
        status: 'error',
        error: new Error('Wallet authentication is required before signing.'),
      };
    }

    walletAuthStore.setPendingPostAuthAction({
      profileId,
      run: onAuthRecovered,
    });
    await onBeforeWalletAuth?.();
    await walletAuthStore.startFlowForProfile(walletAuthContext);

    return {
      status: 'deferred_to_wallet_auth',
    };
  };

  const authorizeOperation = async ({
    profileId,
    request,
    walletAuthContext,
    onBeforeWalletAuth,
    onAuthRecovered,
  }: AuthorizeWalletOperationParams): Promise<WalletOperationAuthorizationResult> => {
    console.log('[wallet-withdraw] authorizeOperation:start', {
      profileId,
      request,
    });

    try {
      const hasActiveSession = await walletAuthAdapter.hasActiveSession();
      console.log('[wallet-withdraw] authorizeOperation:session-check', {
        profileId,
        hasActiveSession,
      });

      if (!hasActiveSession) {
        return deferToWalletAuth(profileId, walletAuthContext, onBeforeWalletAuth, onAuthRecovered);
      }

      const existingSessions = await evmRepository.getAuthorizeSessions(profileId, {
        assetAddress: request.asset_address,
        chain: request.chain,
        status: 'active',
      });
      const reusableSession = findReusableSession(existingSessions, request);
      if (reusableSession) {
        console.log('[wallet-withdraw] authorizeOperation:session-reused', {
          profileId,
          sessionId: reusableSession.session_id,
          asset: reusableSession.asset,
        });

        return {
          status: 'authorized',
          data: {
            profile_id: reusableSession.profile_id,
            session_id: reusableSession.session_id,
            authorization_status: reusableSession.authorization_status,
          },
        };
      }

      const authorizeStart = await evmRepository.authorizeWithdrawStart(profileId, request);
      console.log('[wallet-withdraw] authorizeOperation:authorize-start:success', authorizeStart);

      let ownerSignature = '';
      try {
        ownerSignature = await walletAuthAdapter.signAuthorizationRequest(authorizeStart.signature_request);
        console.log('[wallet-withdraw] authorizeOperation:sign:success', {
          sessionId: authorizeStart.session_id,
          signaturePreview: `${ownerSignature.slice(0, 10)}...${ownerSignature.slice(-6)}`,
        });
      } catch (error) {
        const signerError = toError(error);
        console.error('[wallet-withdraw] authorizeOperation:sign:error', signerError);

        if (isUserRejectedWalletSignatureError(signerError)) {
          return {
            status: 'cancelled',
            error: signerError,
          };
        }

        if (isRecoverableWalletAuthError(signerError) && onAuthRecovered) {
          return deferToWalletAuth(profileId, walletAuthContext, onBeforeWalletAuth, onAuthRecovered);
        }

        return {
          status: 'error',
          error: signerError,
        };
      }

      const authorization = await evmRepository.authorizeWithdrawConfirm(profileId, {
        session_id: authorizeStart.session_id,
        owner_signature: ownerSignature,
      });
      console.log('[wallet-withdraw] authorizeOperation:authorize-confirm:success', authorization);

      return {
        status: 'authorized',
        data: authorization,
      };
    } catch (error) {
      console.error('[wallet-withdraw] authorizeOperation:error', error);
      return {
        status: 'error',
        error: toError(error),
      };
    }
  };

  return {
    authorizeOperation,
  };
}
