import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ref } from 'vue';
import { hexToBigInt, hexToNumber } from 'viem';

const {
  alchemyTransportMock,
  authenticateMock,
  createPublicClientMock,
  createSmartWalletClientMock,
  disconnectMock,
  getBytecodeMock,
  getAuthDetailsMock,
  getAddressMock,
  signerConstructorMock,
  signAuthorizationMock,
  signMessageMock,
  smartWalletSignPreparedCallsMock,
  signTypedDataMock,
  smartWalletPrepareCallsMock,
  smartWalletSendPreparedCallsMock,
  stampWhoamiMock,
  validateMultiFactorsMock,
  statusListeners,
  errorListeners,
} = vi.hoisted(() => ({
  alchemyTransportMock: vi.fn(),
  authenticateMock: vi.fn(),
  createPublicClientMock: vi.fn(),
  createSmartWalletClientMock: vi.fn(),
  disconnectMock: vi.fn(),
  getBytecodeMock: vi.fn(),
  getAuthDetailsMock: vi.fn(),
  getAddressMock: vi.fn(),
  signerConstructorMock: vi.fn(),
  signAuthorizationMock: vi.fn(),
  signMessageMock: vi.fn(),
  smartWalletSignPreparedCallsMock: vi.fn(),
  signTypedDataMock: vi.fn(),
  smartWalletPrepareCallsMock: vi.fn(),
  smartWalletSendPreparedCallsMock: vi.fn(),
  stampWhoamiMock: vi.fn(),
  validateMultiFactorsMock: vi.fn(),
  statusListeners: [] as Array<(status: string) => void>,
  errorListeners: [] as Array<(error?: { message: string }) => void>,
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    ALCHEMY_WALLET_API_KEY: 'test-key',
  },
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: ref({
      data: {
        address: '0xwalletinfo123',
      },
    }),
  }),
}));

vi.mock('@account-kit/wallet-client', () => ({
  createSmartWalletClient: createSmartWalletClientMock,
}));

vi.mock('@account-kit/infra', () => ({
  alchemy: alchemyTransportMock,
  sepolia: { id: 11155111, name: 'Sepolia' },
}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();

  return {
    ...actual,
    createPublicClient: createPublicClientMock,
  };
});

vi.mock('viem/actions', () => ({
  getBytecode: getBytecodeMock,
}));

vi.mock('@account-kit/signer', () => ({
  AlchemySignerStatus: {
    AWAITING_EMAIL_AUTH: 'AWAITING_EMAIL_AUTH',
    AWAITING_OTP_AUTH: 'AWAITING_OTP_AUTH',
    AWAITING_MFA_AUTH: 'AWAITING_MFA_AUTH',
    CONNECTED: 'CONNECTED',
  },
  AlchemyWebSigner: function MockAlchemyWebSigner() {
    signerConstructorMock();

    return {
      authenticate: authenticateMock,
      validateMultiFactors: validateMultiFactorsMock,
      disconnect: disconnectMock,
      getAuthDetails: getAuthDetailsMock,
      getAddress: getAddressMock,
      signAuthorization: signAuthorizationMock,
      signMessage: signMessageMock,
      signTypedData: signTypedDataMock,
      on: (event: string, listener: (...args: any[]) => void) => {
        if (event === 'statusChanged') {
          statusListeners.push(listener as (status: string) => void);
        }

        if (event === 'errorChanged') {
          errorListeners.push(listener as (error?: { message: string }) => void);
        }

        return () => {};
      },
      inner: {
        stampWhoami: stampWhoamiMock,
      },
    };
  },
}));

describe('walletAuthAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '';
    alchemyTransportMock.mockReset();
    authenticateMock.mockReset();
    createPublicClientMock.mockReset();
    createSmartWalletClientMock.mockReset();
    disconnectMock.mockReset();
    getAuthDetailsMock.mockReset();
    getAddressMock.mockReset();
    getBytecodeMock.mockReset();
    signerConstructorMock.mockReset();
    signAuthorizationMock.mockReset();
    signMessageMock.mockReset();
    smartWalletSignPreparedCallsMock.mockReset();
    signTypedDataMock.mockReset();
    smartWalletPrepareCallsMock.mockReset();
    smartWalletSendPreparedCallsMock.mockReset();
    stampWhoamiMock.mockReset();
    validateMultiFactorsMock.mockReset();

    signMessageMock.mockResolvedValue('0xsigned-message');
    signTypedDataMock.mockResolvedValue('0xsigned-typed-data');
    disconnectMock.mockResolvedValue(undefined);
    stampWhoamiMock.mockResolvedValue({ stamped: true });
    validateMultiFactorsMock.mockResolvedValue(undefined);
    signAuthorizationMock.mockResolvedValue({
      r: '0x11',
      s: '0x22',
      yParity: 1,
    });
    alchemyTransportMock.mockReturnValue({ transport: 'alchemy-public-transport' });
    createPublicClientMock.mockReturnValue({ client: 'sepolia-public-client' });
    getAuthDetailsMock.mockResolvedValue({ address: '0xabc123' });
    getAddressMock.mockResolvedValue('0xsigner123');
    getBytecodeMock.mockResolvedValue(undefined);
    smartWalletPrepareCallsMock.mockResolvedValue({
      type: 'user-operation-v070',
      data: { mock: 'prepared' },
      signatureRequest: {
        type: 'personal_sign',
        data: 'wallet-apis-signature',
      },
    });
    smartWalletSendPreparedCallsMock.mockResolvedValue({ id: '0xtxhash' });
    createSmartWalletClientMock.mockReturnValue({
      prepareCalls: smartWalletPrepareCallsMock,
      signPreparedCalls: smartWalletSignPreparedCallsMock,
      sendPreparedCalls: smartWalletSendPreparedCallsMock,
    });
    smartWalletSignPreparedCallsMock.mockImplementation(async (preparedCalls) => {
      if (preparedCalls.type === 'array') {
        return {
          type: 'array',
          data: await Promise.all(preparedCalls.data.map(async (call: any) => {
            if (call.type === 'authorization') {
              await signAuthorizationMock({
                ...call.data,
                chainId: hexToNumber(call.chainId),
                nonce: (() => {
                  const nonce = hexToBigInt(call.data.nonce);
                  return nonce <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nonce) : nonce;
                })(),
              });
              return {
                ...call,
                signature: {
                  type: 'secp256k1',
                  data: '0xsigned-authorization',
                },
              };
            }

            return {
              ...call,
              signature: {
                type: 'secp256k1',
                data: await signMessageMock(call.signatureRequest.data),
              },
            };
          })),
        };
      }

      if (preparedCalls.type === 'authorization') {
        await signAuthorizationMock({
          ...preparedCalls.data,
          chainId: hexToNumber(preparedCalls.chainId),
          nonce: (() => {
            const nonce = hexToBigInt(preparedCalls.data.nonce);
            return nonce <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nonce) : nonce;
          })(),
        });
        return {
          ...preparedCalls,
          signature: {
            type: 'secp256k1',
            data: '0xsigned-authorization',
          },
        };
      }

      return {
        ...preparedCalls,
        signature: {
          type: 'secp256k1',
          data: await signMessageMock((preparedCalls as any).signatureRequest.data),
        },
      };
    });
    statusListeners.length = 0;
    errorListeners.length = 0;
    authenticateMock.mockImplementation(async (payload) => {
      if ((payload as { type?: string }).type === 'email') {
        statusListeners.forEach((listener) => listener('AWAITING_EMAIL_AUTH'));
        return;
      }

      statusListeners.forEach((listener) => listener('CONNECTED'));
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  });

  it('allows retry after iframe container was missing on the first attempt', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const firstAttempt = walletAuthAdapter.startEmailOtp('user@example.com');
    const firstAttemptExpectation = expect(firstAttempt).rejects.toThrow('Iframe container cannot be found');
    await vi.advanceTimersByTimeAsync(3000);

    await firstAttemptExpectation;
    expect(signerConstructorMock).not.toHaveBeenCalled();

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await expect(walletAuthAdapter.startEmailOtp('user@example.com')).resolves.toBe('awaiting_otp');
    expect(signerConstructorMock).toHaveBeenCalledTimes(1);
    expect(authenticateMock).toHaveBeenCalledWith({
      type: 'email',
      emailMode: 'otp',
      email: 'user@example.com',
    });
  });

  it('resolves the start flow according to signer status', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    authenticateMock.mockImplementationOnce(async () => {
      statusListeners.forEach((listener) => listener('AWAITING_MFA_AUTH'));
    });
    await expect(walletAuthAdapter.startEmailOtp('user@example.com')).resolves.toBe('awaiting_mfa');

    authenticateMock.mockImplementationOnce(async () => {
      statusListeners.forEach((listener) => listener('CONNECTED'));
    });
    await expect(walletAuthAdapter.startEmailOtp('user@example.com')).resolves.toBe('connected');
  });

  it('returns awaiting_mfa when otp submission requires authenticator verification', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');

    authenticateMock.mockImplementationOnce(async () => {
      statusListeners.forEach((listener) => listener('AWAITING_MFA_AUTH'));
    });

    await expect(walletAuthAdapter.submitOtp('123456')).resolves.toBe('awaiting_mfa');
    expect(authenticateMock).toHaveBeenLastCalledWith({
      type: 'otp',
      otpCode: '123456',
    });
  });

  it('waits for the signer session to be available before resolving a successful otp retry', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');

    authenticateMock.mockRejectedValueOnce(new Error('Invalid OTP.'));
    await expect(walletAuthAdapter.submitOtp('000000')).rejects.toThrow('Invalid OTP.');

    getAuthDetailsMock.mockResolvedValueOnce(null).mockResolvedValueOnce({ address: '0xabc123' });
    authenticateMock.mockImplementationOnce(async () => {
      setTimeout(() => {
        statusListeners.forEach((listener) => listener('CONNECTED'));
      }, 0);
    });

    const retryPromise = walletAuthAdapter.submitOtp('123456');
    await vi.runAllTimersAsync();

    await expect(retryPromise).resolves.toBe('connected');
  });

  it('submits MFA and includes pending factor id when available', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    statusListeners.forEach((listener) => listener('AWAITING_MFA_AUTH'));

    await walletAuthAdapter.submitMfa('654321');

    expect(validateMultiFactorsMock).toHaveBeenCalledWith({
      multiFactorCode: '654321',
    });
  });

  it('returns stamped whoami payload and active session state', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');

    await expect(walletAuthAdapter.getStampedWhoamiRequest()).resolves.toEqual({ stamped: true });
    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(true);
  });

  it('signs authorization requests after ensuring warmup', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await expect(walletAuthAdapter.signAuthorizationRequest({
      type: 'personal_sign',
      data: 'wallet-apis-signature',
    })).resolves.toBe('0xsigned-message');
  });

  it('falls back to direct authorization signing when Wallet APIs return authorizations', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    createSmartWalletClientMock.mockReturnValue({
      prepareCalls: smartWalletPrepareCallsMock,
      sendPreparedCalls: smartWalletSendPreparedCallsMock,
    });
    smartWalletPrepareCallsMock.mockResolvedValueOnce({
      type: 'authorization',
      chainId: '0xaa36a7',
      data: {
        address: '0xsigner123',
        nonce: '0x1',
      },
    });

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await expect(walletAuthAdapter.signAuthorizationRequest({
      type: 'eth_signTypedData_v4',
      data: { payload: true },
    })).resolves.toBeDefined();
    expect(signAuthorizationMock).toHaveBeenCalled();
  });

  it('warms the signer only once per address', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await walletAuthAdapter.warmSignerWithZeroTransaction();
    await walletAuthAdapter.warmSignerWithZeroTransaction();

    expect(smartWalletPrepareCallsMock).toHaveBeenCalledTimes(1);
    expect(smartWalletSendPreparedCallsMock).toHaveBeenCalledTimes(1);
  });

  it('sends a zero transaction directly', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await expect(walletAuthAdapter.sendZeroTransaction()).resolves.toEqual({ id: '0xtxhash' });
  });

  it('reports whether the signer session is active and resets cached session state', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(true);

    getAuthDetailsMock.mockRejectedValueOnce(new Error('No session'));
    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(false);

    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(true);
    await walletAuthAdapter.resetSession();
    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(true);
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
