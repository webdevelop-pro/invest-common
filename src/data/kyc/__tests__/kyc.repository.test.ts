import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const apiPostMock = vi.hoisted(() => vi.fn());
const loadPlaidScriptOnceMock = vi.hoisted(() => vi.fn());

vi.mock('InvestCommon/config/env', () => ({
  default: {
    PLAID_URL: 'https://plaid.test',
  },
}));

vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: class {
    post = apiPostMock;
    get = vi.fn();
    put = vi.fn();
    options = vi.fn();
  },
}));

vi.mock('InvestCommon/data/plaid/loadPlaidScriptOnce', () => ({
  loadPlaidScriptOnce: loadPlaidScriptOnceMock,
}));

import { useRepositoryKyc } from '../kyc.repository';

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('useRepositoryKyc', () => {
  const plaidCreateMock = vi.fn();
  let originalPlaid: typeof window.Plaid;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    apiPostMock.mockReset();
    loadPlaidScriptOnceMock.mockReset();
    loadPlaidScriptOnceMock.mockResolvedValue(undefined);
    plaidCreateMock.mockReset();
    plaidCreateMock.mockImplementation(() => ({
      open: vi.fn(),
    }));
    originalPlaid = window.Plaid;
    window.Plaid = {
      create: plaidCreateMock,
    };
  });

  afterEach(() => {
    window.Plaid = originalPlaid;
    vi.useRealTimers();
  });

  it('launches Plaid from a provided token and opens the handler after the delay', async () => {
    const store = useRepositoryKyc();
    const resultPromise = store.handlePlaidKycToken('direct-token');

    await flushAsyncWork();

    expect(loadPlaidScriptOnceMock).toHaveBeenCalledTimes(1);
    expect(plaidCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      token: 'direct-token',
      receivedRedirectUri: null,
    }));

    const plaidHandler = plaidCreateMock.mock.results[0]?.value;
    expect(plaidHandler.open).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(plaidHandler.open).toHaveBeenCalledTimes(1);

    const plaidConfig = plaidCreateMock.mock.calls[0]?.[0];
    plaidConfig.onSuccess('public-token', { link_session_id: 'session-1' });

    await expect(resultPromise).resolves.toEqual({ status: 'success' });
    expect(store.isPlaidLoading).toBe(false);
    expect(store.isPlaidDone).toBe(true);
  });

  it('keeps the Plaid promise pending when success metadata does not match the current link session id', async () => {
    const store = useRepositoryKyc();
    const resultPromise = store.handlePlaidKycToken('direct-token');

    await flushAsyncWork();

    const plaidConfig = plaidCreateMock.mock.calls[0]?.[0];
    let resolvedValue: { status: 'success' | 'exit' } | null | undefined;
    void resultPromise.then((value) => {
      resolvedValue = value;
    });

    plaidConfig.onEvent('OPEN', { link_session_id: 'expected-session' });
    plaidConfig.onSuccess('public-token', { link_session_id: 'other-session' });
    await flushAsyncWork();

    expect(resolvedValue).toBeUndefined();
    expect(store.isPlaidLoading).toBe(true);

    plaidConfig.onSuccess('public-token', { link_session_id: 'expected-session' });

    await expect(resultPromise).resolves.toEqual({ status: 'success' });
  });

  it('resolves an unsuccessful result when the Plaid flow exits', async () => {
    const store = useRepositoryKyc();
    const resultPromise = store.handlePlaidKycToken('direct-token');

    await flushAsyncWork();

    const plaidConfig = plaidCreateMock.mock.calls[0]?.[0];
    plaidConfig.onExit(new Error('closed'), { step: 'exit' });

    await expect(resultPromise).resolves.toEqual({ status: 'exit' });
    expect(store.isPlaidLoading).toBe(false);
    expect(store.isPlaidDone).toBe(false);
  });

  it('clears loading and rethrows when Plaid bootstrapping fails', async () => {
    const store = useRepositoryKyc();
    loadPlaidScriptOnceMock.mockRejectedValueOnce(new Error('script failed'));

    await expect(store.handlePlaidKycToken('direct-token')).rejects.toThrow('script failed');
    expect(store.isPlaidLoading).toBe(false);
    expect(store.isPlaidDone).toBe(false);
  });

  it('keeps handlePlaidKyc working through the shared token launcher', async () => {
    apiPostMock.mockResolvedValueOnce({
      data: {
        link_token: 'profile-token',
        expiration: '2099-01-01T00:00:00Z',
        request_id: 'req-1',
      },
      headers: new Headers(),
    });

    const store = useRepositoryKyc();
    const resultPromise = store.handlePlaidKyc(123);

    await flushAsyncWork();

    expect(apiPostMock).toHaveBeenCalledWith('/auth/kyc/123', {});
    await vi.waitFor(() => {
      expect(plaidCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        token: 'profile-token',
      }));
    });

    const plaidConfig = plaidCreateMock.mock.calls[0]?.[0];
    plaidConfig.onSuccess('public-token', { link_session_id: 'profile-session' });

    await expect(resultPromise).resolves.toEqual({ status: 'success' });
    expect(store.kycToken?.link_token).toBe('profile-token');
  });
});
