import {
  AlchemySignerStatus,
  AlchemyWebSigner,
} from '@account-kit/signer';
import env from 'InvestCommon/config/env';

type SignerErrorInfo = {
  message: string;
};

type WalletSigner = {
  authenticate: (payload: unknown) => Promise<unknown>;
  validateMultiFactors: (payload: unknown) => Promise<unknown>;
  getAuthDetails: () => Promise<unknown>;
  signTypedData?: (payload: unknown) => Promise<string>;
  signMessage?: (payload: unknown) => Promise<string>;
  on: (event: string, listener: (...args: any[]) => void) => () => void;
  inner?: {
    stampWhoami?: () => Promise<unknown>;
  };
};

type AuthorizationSignatureRequest = {
  type?: string;
  data?: unknown;
};

type OtpSubmissionResult = 'connected' | 'awaiting_mfa';
type StartEmailOtpResult = 'awaiting_otp' | 'awaiting_mfa' | 'connected';
type PendingState = {
  pendingMfaFactorId?: string;
};

let signerPromise: Promise<WalletSigner> | null = null;
const pendingState: PendingState = {};
const SIGNER_IFRAME_CONTAINER_ID = 'alchemy-signer-iframe-container';
const SIGNER_IFRAME_WAIT_TIMEOUT_MS = 3000;

const toError = (error?: SignerErrorInfo | Error) => (
  error instanceof Error
    ? error
    : new Error(error?.message || 'Wallet authentication failed.')
);

const waitForIframeContainer = async () => {
  if (typeof document === 'undefined') {
    return;
  }

  const existingContainer = document.getElementById(SIGNER_IFRAME_CONTAINER_ID);
  if (existingContainer) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      if (document.getElementById(SIGNER_IFRAME_CONTAINER_ID)) {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= SIGNER_IFRAME_WAIT_TIMEOUT_MS) {
        reject(new Error('Iframe container cannot be found'));
        return;
      }

      window.requestAnimationFrame(check);
    };

    check();
  });
};

const createSigner = async () => {
  if (!env.ALCHEMY_WALLET_API_KEY) {
    throw new Error('Wallet auth is not configured. Missing Alchemy API key.');
  }

  await waitForIframeContainer();

  const signer = new AlchemyWebSigner({
    client: {
      connection: {
        apiKey: env.ALCHEMY_WALLET_API_KEY,
      },
      iframeConfig: {
        iframeContainerId: SIGNER_IFRAME_CONTAINER_ID,
      },
    },
  });

  signer.on('mfaStatusChanged', (mfaStatus) => {
    pendingState.pendingMfaFactorId = mfaStatus?.mfaFactorId;
  });

  signer.on('connected', () => {
    pendingState.pendingMfaFactorId = undefined;
  });

  return signer;
};

const getSigner = async () => {
  if (!signerPromise) {
    signerPromise = createSigner().catch((error) => {
      signerPromise = null;
      throw error;
    });
  }

  return signerPromise;
};

export const walletAuthAdapter = {
  async startEmailOtp(email: string) {
    const signer = await getSigner();
    return new Promise<StartEmailOtpResult>((resolve, reject) => {
      let settled = false;
      const cleanups: Array<() => void> = [];
      const settle = (callback: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanups.splice(0).forEach((cleanup) => cleanup());
        callback();
      };

      cleanups.push(
        signer.on('statusChanged', (status: AlchemySignerStatus) => {
          if (status === AlchemySignerStatus.AWAITING_EMAIL_AUTH
            || status === AlchemySignerStatus.AWAITING_OTP_AUTH) {
            settle(() => resolve('awaiting_otp'));
          }

          if (status === AlchemySignerStatus.AWAITING_MFA_AUTH) {
            settle(() => resolve('awaiting_mfa'));
          }

          if (status === AlchemySignerStatus.CONNECTED) {
            settle(() => resolve('connected'));
          }
        }),
      );

      cleanups.push(
        signer.on('errorChanged', (error?: SignerErrorInfo) => {
          if (error) {
            settle(() => reject(toError(error)));
          }
        }),
      );

      signer.authenticate({
        type: 'email',
        emailMode: 'otp',
        email,
      }).catch((error) => {
        settle(() => reject(toError(error as Error)));
      });
    });
  },

  async submitOtp(otpCode: string) {
    const signer = await getSigner();
    return new Promise<OtpSubmissionResult>((resolve, reject) => {
      let settled = false;
      const cleanups: Array<() => void> = [];
      const settle = (callback: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanups.splice(0).forEach((cleanup) => cleanup());
        callback();
      };

      cleanups.push(
        signer.on('statusChanged', (status: AlchemySignerStatus) => {
          if (status === AlchemySignerStatus.AWAITING_MFA_AUTH) {
            settle(() => resolve('awaiting_mfa'));
          }

          if (status === AlchemySignerStatus.CONNECTED) {
            settle(() => resolve('connected'));
          }
        }),
      );

      cleanups.push(
        signer.on('errorChanged', (error?: SignerErrorInfo) => {
          if (error) {
            settle(() => reject(toError(error)));
          }
        }),
      );

      signer.authenticate({
        type: 'otp',
        otpCode,
      }).then(() => {
        settle(() => resolve('connected'));
      }).catch((error) => {
        settle(() => reject(toError(error as Error)));
      });
    });
  },

  async submitMfa(multiFactorCode: string) {
    const signer = await getSigner();
    await signer.validateMultiFactors({
      multiFactorCode,
      ...(pendingState.pendingMfaFactorId
        ? { multiFactorId: pendingState.pendingMfaFactorId }
        : {}),
    });
    pendingState.pendingMfaFactorId = undefined;
  },

  async getAuthDetails() {
    const signer = await getSigner();
    return signer.getAuthDetails();
  },

  async getStampedWhoamiRequest() {
    const signer = await getSigner();
    const stampedWhoamiRequest = await signer.inner?.stampWhoami?.();

    if (!stampedWhoamiRequest) {
      throw new Error('Wallet auth succeeded, but the stamped whoami payload is missing.');
    }

    return stampedWhoamiRequest;
  },

  async signAuthorizationRequest(signatureRequest: AuthorizationSignatureRequest) {
    const signer = await getSigner();
    const requestType = String(signatureRequest?.type ?? '').trim().toLowerCase();

    if (requestType === 'eth_signtypeddata_v4' || requestType === 'eth_signtypeddata') {
      if (!signer.signTypedData) {
        throw new Error('Wallet signer does not support typed-data signing.');
      }

      return signer.signTypedData(signatureRequest.data);
    }

    if (requestType === 'personal_sign' || requestType === 'eth_sign' || requestType === 'signmessage') {
      if (!signer.signMessage) {
        throw new Error('Wallet signer does not support message signing.');
      }

      return signer.signMessage(signatureRequest.data);
    }

    if (signer.signTypedData) {
      return signer.signTypedData(signatureRequest.data);
    }

    if (signer.signMessage) {
      return signer.signMessage(signatureRequest.data);
    }

    throw new Error('Wallet signer cannot sign the authorization request.');
  },
};
