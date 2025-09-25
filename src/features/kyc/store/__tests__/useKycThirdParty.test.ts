import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKycThirdParty } from '../useKycThirdParty';

vi.mock('InvestCommon/data/plaid/loadPlaidScriptOnce', () => ({
  loadPlaidScriptOnce: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('InvestCommon/data/repository/error/toasterErrorHandlingAnalytics', () => ({
  toasterErrorHandlingAnalytics: vi.fn(),
}));

describe('useKycThirdParty', () => {
  let store: ReturnType<typeof useKycThirdParty>;
  let originalLocation: Location;
  let originalPlaid: any;

  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { search: '?token=test-token&expiration=123&request_id=req-1' },
    });
    originalPlaid = window.Plaid;
    window.Plaid = {
      create: vi.fn().mockImplementation((opts) => ({
        open: vi.fn(),
        ...opts,
      })),
    };
    store = useKycThirdParty();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    window.Plaid = originalPlaid;
    vi.useRealTimers();
  });

  it('loads Plaid (via loader) and calls Plaid.create with correct token', async () => {
    await store.handlePlaidKycThirdParty();
    expect(window.Plaid.create).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('triggers handler.open after timeout', async () => {
    await store.handlePlaidKycThirdParty();
    const handlerInstance = (window.Plaid.create as any).mock.results[0].value;
    const openSpy = handlerInstance.open as ReturnType<typeof vi.fn>;
    expect(openSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(openSpy).toHaveBeenCalled();
  });

  it('handles onSuccess and updates state', async () => {
    await store.handlePlaidKycThirdParty();
    const handlerArgs = (window.Plaid.create as any).mock.calls[0][0];
    handlerArgs.onSuccess('pub', { link_session_id: 'abc' });
    expect(store.isPlaidLoading.value).toBe(false);
    expect(store.plaidSuccess.value).toBe(true);
  });

  it('handles onExit without throwing and stops loading', async () => {
    await store.handlePlaidKycThirdParty();
    const handlerArgs = (window.Plaid.create as any).mock.calls[0][0];
    expect(() => handlerArgs.onExit('err', { meta: 1 })).not.toThrow();
    expect(store.isPlaidLoading.value).toBe(false);
  });
});
