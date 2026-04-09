import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const {
  authenticateMock,
  getAuthDetailsMock,
  signerConstructorMock,
  signMessageMock,
  signTypedDataMock,
  statusListeners,
  errorListeners,
} = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
  getAuthDetailsMock: vi.fn(),
  signerConstructorMock: vi.fn(),
  signMessageMock: vi.fn(),
  signTypedDataMock: vi.fn(),
  statusListeners: [] as Array<(status: string) => void>,
  errorListeners: [] as Array<(error?: { message: string }) => void>,
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    ALCHEMY_WALLET_API_KEY: 'test-key',
  },
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
    authenticateMock.mockReset();
    getAuthDetailsMock.mockReset();
    signerConstructorMock.mockReset();
    signMessageMock.mockReset();
    signTypedDataMock.mockReset();
    signMessageMock.mockResolvedValue('0xsigned-message');
    signTypedDataMock.mockResolvedValue('0xsigned-typed-data');
    getAuthDetailsMock.mockResolvedValue({ address: '0xabc123' });
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
    await expect(walletAuthAdapter.signAuthorizationRequest({
      type: 'eth_signTypedData_v4',
      data: typedData,
    })).resolves.toBe('0xsigned-typed-data');

    expect(signTypedDataMock).toHaveBeenCalledWith(typedData);
    expect(signMessageMock).not.toHaveBeenCalled();
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
