import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKycThirdParty } from '../useKycThirdParty';

const toastMock = vi.fn();

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('InvestCommon/data/repository/error/toasterErrorHandling', () => ({
  toasterErrorHandling: vi.fn(),
}));

describe('useKycThirdParty', () => {
  let store: ReturnType<typeof useKycThirdParty>;
  let originalLocation: Location;
  let originalPlaid: any;
  let scriptEl: any;

  beforeEach(() => {
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
    scriptEl = { setAttribute: vi.fn(), onload: null, tagName: 'SCRIPT' };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      return tag === 'script' ? scriptEl : document.createElement(tag);
    });
    vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => el);
    store = useKycThirdParty();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    window.Plaid = originalPlaid;
    (document.createElement as any).mockRestore?.();
    (document.head.appendChild as any).mockRestore?.();
  });

  it('loads Plaid script and calls Plaid.create with correct token', async () => {
    await store.handlePlaidKycThirdParty();
    scriptEl.onload && scriptEl.onload();
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(document.head.appendChild).toHaveBeenCalled();
    expect(window.Plaid.create).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'test-token' })
    );
  });

  it('handles onSuccess and shows toast', async () => {
    await store.handlePlaidKycThirdParty();
    scriptEl.onload && scriptEl.onload();
    const handlerArgs = (window.Plaid.create as any).mock.calls[0][0];
    handlerArgs.onSuccess();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Thank you for completing KYC',
        description: 'Your KYC process is now complete.',
        variant: 'info',
      })
    );
  });

  it('handles onExit without throwing', async () => {
    await store.handlePlaidKycThirdParty();
    scriptEl.onload && scriptEl.onload();
    const handlerArgs = (window.Plaid.create as any).mock.calls[0][0];
    expect(() => handlerArgs.onExit('err', { meta: 1 })).not.toThrow();
  });
}); 