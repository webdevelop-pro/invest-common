import {
  alchemy,
  sepolia,
} from '@account-kit/infra';
import {
  createSmartWalletClient,
  type PrepareCallsResult,
  type SendPreparedCallsResult,
} from '@account-kit/wallet-client';
import {
  AlchemySignerStatus,
  AlchemyWebSigner,
} from '@account-kit/signer';
import { vToYParity } from 'ox/Signature';
import { createPublicClient, hexToBigInt, hexToNumber, serializeSignature, zeroAddress } from 'viem';
import { getBytecode } from 'viem/actions';
import env from 'InvestCommon/config/env';
import type {
  AuthorizationSignatureRequest,
  OtpSubmissionResult,
  PendingState,
  SignerErrorInfo,
  StartEmailOtpResult,
  WalletSigner,
} from './walletAuth.types';

let signerPromise: Promise<WalletSigner> | null = null;
const pendingState: PendingState = {};
const SIGNER_IFRAME_CONTAINER_ID = 'alchemy-signer-iframe-container';
const SIGNER_IFRAME_WAIT_TIMEOUT_MS = 3000;
const EIP_7702_DELEGATION_PREFIX = '0xef0100';
let warmedSignerAddress = '';

const clearCachedSignerState = () => {
  signerPromise = null;
  pendingState.pendingMfaFactorId = undefined;
  warmedSignerAddress = '';
};

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

const getSignableMessagePayload = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload;
  }

  const message = (payload as { message?: unknown } | null | undefined)?.message;

  if (typeof message === 'string') {
    return message;
  }

  return undefined;
};

const createSignerSmartWalletClient = async (signer: WalletSigner) => {
  const signerAddress = (await signer.getAddress()).trim();

  if (!signerAddress) {
    throw new Error('Wallet signer address is unavailable for Wallet APIs initialization.');
  }

  if (!env.ALCHEMY_7702_POLICY_ID) {
    throw new Error('Wallet auth is not configured. Missing Alchemy 7702 policy ID.');
  }

  console.log('[walletAuthAdapter] createSignerSmartWalletClient:getSignerAddress', {
    signerAddress,
    hasApiKey: Boolean(env.ALCHEMY_WALLET_API_KEY),
  });

  return createSmartWalletClient({
    transport: alchemy({ apiKey: env.ALCHEMY_WALLET_API_KEY }),
    chain: sepolia,
    signer: signer as any,
    account: signerAddress,
    policyId: env.ALCHEMY_7702_POLICY_ID,
  });
};

const createSepoliaPublicClient = () => createPublicClient({
  chain: sepolia,
  transport: alchemy({
    apiKey: env.ALCHEMY_WALLET_API_KEY,
  }),
});

const is7702Enabled = async (eoaAddress: string) => {
  const code = await getBytecode(createSepoliaPublicClient(), {
    address: eoaAddress as `0x${string}`,
  });

  return code?.startsWith(EIP_7702_DELEGATION_PREFIX) ?? false;
};

const createZeroValueNoopCall = () => ({
  to: zeroAddress,
  data: '0x' as const,
  value: '0x0' as const,
});

const summarizePreparedCalls = (preparedCalls: PrepareCallsResult) => {
  if (preparedCalls.type !== 'array') {
    return {
      type: preparedCalls.type,
      hasSignatureRequest: 'signatureRequest' in preparedCalls && Boolean(preparedCalls.signatureRequest),
      chainId: 'chainId' in preparedCalls ? (preparedCalls as { chainId?: unknown }).chainId : undefined,
      nonce: 'data' in preparedCalls
        ? ((preparedCalls as { data?: { nonce?: unknown } }).data?.nonce)
        : undefined,
    };
  }

  return preparedCalls.data.map((call) => ({
    type: call.type,
    hasSignatureRequest: 'signatureRequest' in call && Boolean(call.signatureRequest),
    chainId: 'chainId' in call ? (call as { chainId?: unknown }).chainId : undefined,
    nonce: 'data' in call
      ? ((call as { data?: { nonce?: unknown } }).data?.nonce)
      : undefined,
  }));
};

const summarizeSignedCalls = (signedCalls: Awaited<ReturnType<typeof signWalletApisPreparedCalls>>) => {
  if (signedCalls.type !== 'array') {
    return {
      type: signedCalls.type,
      chainId: 'chainId' in signedCalls ? (signedCalls as { chainId?: unknown }).chainId : undefined,
      nonce: 'data' in signedCalls
        ? ((signedCalls as { data?: { nonce?: unknown } }).data?.nonce)
        : undefined,
      signatureType: (signedCalls as { signature?: { type?: unknown } }).signature?.type,
    };
  }

  return signedCalls.data.map((call) => ({
    type: call.type,
    chainId: 'chainId' in call ? (call as { chainId?: unknown }).chainId : undefined,
    nonce: 'data' in call
      ? ((call as { data?: { nonce?: unknown } }).data?.nonce)
      : undefined,
    signatureType: (call as { signature?: { type?: unknown } }).signature?.type,
  }));
};

const signWalletApisPreparedCalls = async (
  signer: WalletSigner,
  preparedCalls: PrepareCallsResult,
  client?: Awaited<ReturnType<typeof createSignerSmartWalletClient>>,
) => {
  console.log('[walletAuthAdapter] signWalletApisPreparedCalls:start', {
    type: preparedCalls.type,
  });

  if (client?.signPreparedCalls) {
    return client.signPreparedCalls(preparedCalls);
  }

  const signPreparedUserOperation = async (
    call: Extract<PrepareCallsResult, { type: 'user-operation-v060' | 'user-operation-v070' }>
      | Exclude<Extract<PrepareCallsResult, { type: 'array' }>['data'][number], { type: 'authorization' }>,
  ) => {
    const {
      signatureRequest,
      feePayment: _feePayment,
      ...rest
    } = call as typeof call & { feePayment?: unknown };

    if (!signatureRequest) {
      throw new Error('Wallet APIs did not return a signature request for the prepared calls.');
    }

    return {
      ...rest,
      signature: await signWalletSignatureRequest(signer, signatureRequest),
    };
  };

  const signPreparedAuthorization = async (
    call: Extract<PrepareCallsResult, { type: 'authorization' }>
      | Extract<Extract<PrepareCallsResult, { type: 'array' }>['data'][number], { type: 'authorization' }>,
  ) => {
    const { signatureRequest: _signatureRequest, ...rest } = call;
    console.log('[walletAuthAdapter] signPreparedAuthorization:start', {
      chainId: call.chainId,
      nonce: call.data?.nonce,
      address: call.data?.address,
    });

    if (!signer.signAuthorization) {
      throw new Error('Wallet signer does not support EIP-7702 authorization signing.');
    }

    const authorizationNonce = hexToBigInt(call.data.nonce);
    const signedAuthorization = await signer.signAuthorization({
      ...call.data,
      chainId: hexToNumber(call.chainId),
      nonce: authorizationNonce <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(authorizationNonce)
        : authorizationNonce,
    }) as {
      r: `0x${string}`;
      s: `0x${string}`;
      v?: number | bigint | string;
      yParity?: number | bigint | string;
    };

    const yParityValue = signedAuthorization.yParity;
    const yParity = yParityValue != null
      ? Number(yParityValue)
      : vToYParity(Number(signedAuthorization.v));

    return {
      ...rest,
      signature: {
        type: 'secp256k1' as const,
        data: serializeSignature({
          r: signedAuthorization.r,
          s: signedAuthorization.s,
          yParity,
        }),
      },
    };
  };

  if (preparedCalls.type === 'array') {
    return {
      type: 'array' as const,
      data: await Promise.all(preparedCalls.data.map((call) => (
        call.type === 'authorization'
          ? signPreparedAuthorization(call)
          : signPreparedUserOperation(call)
      ))),
    };
  }

  if (preparedCalls.type === 'authorization') {
    return signPreparedAuthorization(preparedCalls);
  }

  return signPreparedUserOperation(preparedCalls);
};

const forceEnable7702 = async (signer: WalletSigner) => {
  const eoaAddress = (await signer.getAddress()).trim();
  if (!eoaAddress) {
    throw new Error('Wallet signer address is unavailable for EIP-7702 enablement.');
  }

  const alreadyEnabled = await is7702Enabled(eoaAddress);
  console.log('[walletAuthAdapter] forceEnable7702:delegationCheck', {
    eoaAddress,
    alreadyEnabled,
  });

  if (alreadyEnabled) {
    return {
      status: 'already_enabled' as const,
      eoaAddress,
    };
  }

  const client = await createSignerSmartWalletClient(signer);
  console.log('[walletAuthAdapter] forceEnable7702:sendNoopZeroTx', {
    eoaAddress,
  });
  const { response } = await sendZeroTransaction(signer, client);

  return {
    status: 'enabled' as const,
    client,
    eoaAddress,
    response,
  };
};

const sendZeroTransaction = async (
  signer: WalletSigner,
  existingClient?: Awaited<ReturnType<typeof createSignerSmartWalletClient>>,
) => {
  const eoaAddress = (await signer.getAddress()).trim();
  if (!eoaAddress) {
    throw new Error('Wallet signer address is unavailable for zero-value transaction sending.');
  }

  const client = existingClient ?? await createSignerSmartWalletClient(signer);
  const zeroValueCall = createZeroValueNoopCall();
  console.log('[walletAuthAdapter] sendZeroTransaction:start', {
    eoaAddress,
    account: eoaAddress,
    call: {
      ...zeroValueCall,
      value: zeroValueCall.value,
    },
  });

  try {
    const preparedCalls = await client.prepareCalls({
      account: eoaAddress as `0x${string}`,
      calls: [zeroValueCall],
    });
    console.log('[walletAuthAdapter] sendZeroTransaction:prepared', {
      eoaAddress,
      type: preparedCalls.type,
      account: eoaAddress,
      preparedCalls,
      preparedCallsSummary: summarizePreparedCalls(preparedCalls),
    });

    const signedCalls = await signWalletApisPreparedCalls(signer, preparedCalls, client);
    console.log('[walletAuthAdapter] sendZeroTransaction:signed', {
      eoaAddress,
      type: signedCalls.type,
      signedCalls,
      signedCallsSummary: summarizeSignedCalls(signedCalls),
    });
    const response = await client.sendPreparedCalls(signedCalls) as SendPreparedCallsResult;
    console.log('[walletAuthAdapter] sendZeroTransaction:response', {
      eoaAddress,
      response,
    });

    return {
      client,
      eoaAddress,
      response,
    };
  } catch (error) {
    console.log('[walletAuthAdapter] sendZeroTransaction:error', {
      eoaAddress,
      account: eoaAddress,
      error,
      message: (error as Error)?.message,
      cause: (error as Error & { cause?: unknown })?.cause,
    });
    throw error;
  }
};

const signWalletSignatureRequest = async (
  signer: WalletSigner,
  signatureRequest: AuthorizationSignatureRequest,
) => {
  const requestType = String(signatureRequest?.type ?? '').trim().toLowerCase();
  const signableMessage = getSignableMessagePayload(signatureRequest?.data);
  console.log('[walletAuthAdapter] signWalletSignatureRequest:start', {
    requestType,
    hasSignableMessage: Boolean(signableMessage),
    hasData: signatureRequest?.data != null,
  });

  if (requestType === 'eth_signtypeddata_v4' || requestType === 'eth_signtypeddata') {
    if (signableMessage) {
      if (!signer.signMessage) {
        throw new Error('Wallet signer does not support message signing.');
      }

      return signer.signMessage(signableMessage);
    }

    if (!signer.signTypedData) {
      throw new Error('Wallet signer does not support typed-data signing.');
    }

    return signer.signTypedData(signatureRequest.data);
  }

  if (requestType === 'personal_sign' || requestType === 'eth_sign' || requestType === 'signmessage') {
    if (!signer.signMessage) {
      throw new Error('Wallet signer does not support message signing.');
    }

    return signer.signMessage(signableMessage ?? signatureRequest.data);
  }

  if (signer.signTypedData) {
    return signer.signTypedData(signatureRequest.data);
  }

  if (signer.signMessage) {
    return signer.signMessage(signatureRequest.data);
  }

  throw new Error('Wallet signer cannot sign the authorization request.');
};

export const walletAuthAdapter = {
  async startEmailOtp(email: string) {
    const signer = await getSigner();
    return new Promise<StartEmailOtpResult>((resolve, reject) => {
      // The signer replays its current status and error to new listeners.
      // Start the auth attempt first so stale state from a previous attempt is cleared
      // before we subscribe to this attempt's events.
      const authenticateRequest = signer.authenticate({
        type: 'email',
        emailMode: 'otp',
        email,
      });
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

      authenticateRequest.catch((error) => {
        settle(() => reject(toError(error as Error)));
      });
    });
  },

  async submitOtp(otpCode: string) {
    const signer = await getSigner();
    return new Promise<OtpSubmissionResult>((resolve, reject) => {
      // See startEmailOtp: listeners receive the signer's current error immediately,
      // so the fresh auth request must clear any stale error before we subscribe.
      const authenticateRequest = signer.authenticate({
        type: 'otp',
        otpCode,
      });
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

      authenticateRequest.then(async () => {
        const authDetails = await signer.getAuthDetails().catch(() => null);
        if (authDetails) {
          settle(() => resolve('connected'));
        }
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

  async hasActiveSession() {
    const signer = await getSigner();
    const user = await signer.getAuthDetails().catch(() => null);

    return Boolean(user);
  },

  async getStampedWhoamiRequest() {
    const signer = await getSigner();
    const stampedWhoamiRequest = await signer.inner?.stampWhoami?.();

    if (!stampedWhoamiRequest) {
      throw new Error('Wallet auth succeeded, but the stamped whoami payload is missing.');
    }

    return stampedWhoamiRequest;
  },

  async warmSignerWithZeroTransaction() {
    const signer = await getSigner();
    const signerAddress = (await signer.getAddress()).trim();
    console.log('[walletAuthAdapter] warmSignerWithZeroTransaction:start', {
      signerAddress,
      warmedSignerAddress,
    });

    if (!signerAddress) {
      console.log('[walletAuthAdapter] warmSignerWithZeroTransaction:missingSignerAddress');
      throw new Error('Wallet signer address is unavailable for authorization warmup.');
    }

    if (warmedSignerAddress === signerAddress) {
      console.log('[walletAuthAdapter] warmSignerWithZeroTransaction:skipAlreadyWarmed', {
        signerAddress,
      });
      return;
    }

    try {
      const result = await forceEnable7702(signer);
      warmedSignerAddress = result.eoaAddress;
      console.log('[walletAuthAdapter] warmSignerWithZeroTransaction:sent', {
        signerAddress,
        warmedSignerAddress,
        status: result.status,
        response: 'response' in result ? result.response : undefined,
      });
    } catch (error) {
      console.log('[walletAuthAdapter] warmSignerWithZeroTransaction:error', {
        signerAddress,
        warmedSignerAddress,
        error,
      });
      throw error;
    }
  },

  async ensureAuthorizationSigningReady() {
    await this.warmSignerWithZeroTransaction();
  },

  async sendZeroTransaction() {
    const signer = await getSigner();
    const result = await sendZeroTransaction(signer);
    warmedSignerAddress = result.eoaAddress;
    console.log('[walletAuthAdapter] sendZeroTransaction:sent', {
      signerAddress: result.eoaAddress,
      warmedSignerAddress,
      response: result.response,
    });
    return result.response;
  },

  async signAuthorizationRequest(signatureRequest: AuthorizationSignatureRequest) {
    const signer = await getSigner();
    await this.ensureAuthorizationSigningReady();
    return signWalletSignatureRequest(signer, signatureRequest);
  },

  async resetSession() {
    const signer = await signerPromise?.catch(() => null);

    try {
      await signer?.disconnect?.();
    } finally {
      clearCachedSignerState();
    }
  },
};
