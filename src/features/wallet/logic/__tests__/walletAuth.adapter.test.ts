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
  statusListeners,
  errorListeners,
} = vi.hoisted(() => ({
  alchemyTransportMock: vi.fn(),
  authenticateMock: vi.fn(),
  createPublicClientMock: vi.fn(),
  createSmartWalletClientMock: vi.fn(),
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
      validateMultiFactors: vi.fn(),
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
        stampWhoami: vi.fn(),
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
    getAuthDetailsMock.mockReset();
    getAddressMock.mockReset();
    getBytecodeMock.mockReset();
    signerConstructorMock.mockReset();
    signAuthorizationMock.mockReset();
    signMessageMock.mockReset();
    smartWalletSignPreparedCallsMock.mockReset();
    signTypedDataMock.mockReset();
    createSmartWalletClientMock.mockReset();
    smartWalletPrepareCallsMock.mockReset();
    smartWalletSendPreparedCallsMock.mockReset();
    signMessageMock.mockResolvedValue('0xsigned-message');
    signTypedDataMock.mockResolvedValue('0xsigned-typed-data');
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
    authenticateMock.mockImplementation(async () => {
      statusListeners.forEach((listener) => listener('AWAITING_EMAIL_AUTH'));
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

  it('returns the signer status reached after starting email auth', async () => {
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

  it('signs signature_request.data.message when the backend returns a message payload', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await expect(walletAuthAdapter.signAuthorizationRequest({
      type: 'eth_signTypedData_v4',
      data: {
        message: 'Authorize wallet session',
      },
    })).resolves.toBe('0xsigned-message');

    expect(signMessageMock).toHaveBeenCalledWith('Authorize wallet session');
    expect(signTypedDataMock).not.toHaveBeenCalled();
    expect(createSmartWalletClientMock).toHaveBeenCalledWith({
      transport: { transport: 'alchemy-public-transport' },
      chain: { id: 11155111, name: 'Sepolia' },
      signer: expect.any(Object),
      account: '0xsigner123',
      policyId: 'e9f2620b-e800-4b5d-8d54-c738a5863483',
    });
    expect(alchemyTransportMock).toHaveBeenCalledWith({
      apiKey: 'test-key',
    });
    expect(createPublicClientMock).toHaveBeenCalledWith({
      chain: { id: 11155111, name: 'Sepolia' },
      transport: { transport: 'alchemy-public-transport' },
    });
    expect(getBytecodeMock).toHaveBeenCalledWith({ client: 'sepolia-public-client' }, {
      address: '0xsigner123',
    });
    expect(smartWalletPrepareCallsMock).toHaveBeenCalledWith({
      account: '0xsigner123',
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0x',
          value: '0x0',
        },
      ],
    });
    expect(smartWalletSendPreparedCallsMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'user-operation-v070',
      data: { mock: 'prepared' },
      signature: {
        type: 'secp256k1',
        data: '0xsigned-message',
      },
    }));
  });

  it('keeps full typed-data signing for eip712 payloads', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    const typedData = {
      domain: { name: 'Wallet Session', version: '1', chainId: 1 },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
        ],
        WalletSessionAuthorization: [
          { name: 'sessionId', type: 'string' },
        ],
      },
      primaryType: 'WalletSessionAuthorization',
      message: {
        sessionId: 'session_confirm_1',
      },
    };

    await walletAuthAdapter.startEmailOtp('user@example.com');
    signMessageMock.mockClear();
    signTypedDataMock.mockClear();
    await expect(walletAuthAdapter.signAuthorizationRequest({
      type: 'eth_signTypedData_v4',
      data: typedData,
    })).resolves.toBe('0xsigned-typed-data');

    expect(signTypedDataMock).toHaveBeenCalledWith(typedData);
  });

  it('warms the signer once before authorization signing when sendCalls is available', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await walletAuthAdapter.signAuthorizationRequest({
      type: 'personal_sign',
      data: 'first signature',
    });
    await walletAuthAdapter.signAuthorizationRequest({
      type: 'personal_sign',
      data: 'second signature',
    });

    expect(createSmartWalletClientMock).toHaveBeenCalledTimes(1);
    expect(smartWalletPrepareCallsMock).toHaveBeenCalledTimes(1);
    expect(smartWalletSendPreparedCallsMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledTimes(3);
  });

  it('skips prepare and send when EIP-7702 delegation is already enabled for the EOA', async () => {
    getBytecodeMock.mockResolvedValueOnce('0xef0100deadbeef');
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await walletAuthAdapter.warmSignerWithZeroTransaction();

    expect(getBytecodeMock).toHaveBeenCalledWith({ client: 'sepolia-public-client' }, {
      address: '0xsigner123',
    });
    expect(smartWalletPrepareCallsMock).not.toHaveBeenCalled();
    expect(smartWalletSendPreparedCallsMock).not.toHaveBeenCalled();
  });

  it('signs the EIP-7702 authorization returned by Wallet APIs before sending prepared calls', async () => {
    smartWalletPrepareCallsMock.mockResolvedValueOnce({
      type: 'array',
      data: [
        {
          type: 'authorization',
          chainId: '0xaa36a7',
          data: {
            address: '0xsigner123',
            nonce: '0x1',
          },
        },
        {
          type: 'user-operation-v070',
          data: { mock: 'prepared' },
          signatureRequest: {
            type: 'personal_sign',
            data: 'wallet-apis-signature',
          },
        },
      ],
    });

    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await walletAuthAdapter.warmSignerWithZeroTransaction();

    expect(signAuthorizationMock).toHaveBeenCalledWith({
      address: '0xsigner123',
      nonce: 1,
      chainId: 11155111,
    });
    expect(smartWalletSendPreparedCallsMock).toHaveBeenCalledWith({
      type: 'array',
      data: [
        expect.objectContaining({
          type: 'authorization',
          signature: {
            type: 'secp256k1',
            data: expect.any(String),
          },
        }),
        expect.objectContaining({
          type: 'user-operation-v070',
          signature: {
            type: 'secp256k1',
            data: '0xsigned-message',
          },
        }),
      ],
    });
  });

  it('sends a real zero-value self-call for the manual 0 tx flow', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await walletAuthAdapter.startEmailOtp('user@example.com');
    await expect(walletAuthAdapter.sendZeroTransaction()).resolves.toEqual({ id: '0xtxhash' });

    expect(smartWalletPrepareCallsMock).toHaveBeenCalledWith({
      account: '0xsigner123',
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0x',
          value: '0x0',
        },
      ],
    });
    expect(smartWalletSendPreparedCallsMock).toHaveBeenCalledTimes(1);
  });

  it('reports whether the signer has an active cached session', async () => {
    const { walletAuthAdapter } = await import('../walletAuth.adapter');

    const container = document.createElement('div');
    container.id = 'alchemy-signer-iframe-container';
    document.body.appendChild(container);

    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(true);

    getAuthDetailsMock.mockRejectedValueOnce(new Error('Not authenticated'));
    await expect(walletAuthAdapter.hasActiveSession()).resolves.toBe(false);
  });
});
