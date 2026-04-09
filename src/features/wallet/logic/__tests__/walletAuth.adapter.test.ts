import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const {
  authenticateMock,
  signerConstructorMock,
  statusListeners,
  errorListeners,
} = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
  signerConstructorMock: vi.fn(),
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
      getAuthDetails: vi.fn(),
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
    signerConstructorMock.mockReset();
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
});
