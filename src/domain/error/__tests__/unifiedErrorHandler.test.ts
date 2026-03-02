import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupErrorHandling, setupUnifiedErrorHandler } from '../unifiedErrorHandler';

const mockReportError = vi.fn();
const mockSetErrorHandlers = vi.fn();
const mockSetErrorLogger = vi.fn();
const mockRedirectToSignin = vi.fn();

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
  setErrorHandlers: (...args: unknown[]) => mockSetErrorHandlers(...args),
  setErrorLogger: (...args: unknown[]) => mockSetErrorLogger(...args),
}));

vi.mock('InvestCommon/domain/redirects/redirectAuthGuard', () => ({
  redirectToSigninForUnauthorized: () => mockRedirectToSignin(),
}));

vi.mock('InvestCommon/domain/analytics/sendReportedErrorToAnalytics', () => ({
  sendReportedErrorToAnalytics: vi.fn(),
}));

describe('setupErrorHandling', () => {
  const originalEnv = import.meta.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    (import.meta as { env: Record<string, string> }).env = { ...originalEnv, VITE_ENV: 'test' };
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
  });

  afterEach(() => {
    (import.meta as { env: Record<string, string> }).env = originalEnv;
  });

  it('does nothing when window is undefined', () => {
    const win = global.window;
    Object.defineProperty(global, 'window', { value: undefined, writable: true });
    setupErrorHandling({ type: 'vue' });
    expect(mockSetErrorHandlers).not.toHaveBeenCalled();
    expect(mockSetErrorLogger).not.toHaveBeenCalled();
    Object.defineProperty(global, 'window', { value: win, writable: true });
  });

  it.skip('skips when VITE_ENV is local (import.meta.env may be replaced at build time)', () => {
    const meta = import.meta as { env?: Record<string, string> };
    const orig = meta.env;
    meta.env = { ...orig, VITE_ENV: 'local' };
    mockSetErrorHandlers.mockClear();
    mockSetErrorLogger.mockClear();
    setupErrorHandling({ type: 'vue' });
    expect(mockSetErrorHandlers).not.toHaveBeenCalled();
    expect(mockSetErrorLogger).not.toHaveBeenCalled();
    meta.env = orig;
  });

  it('calls setErrorHandlers with redirectToSigninForUnauthorized for type vue when onUnauthorized not provided', () => {
    setupErrorHandling({ type: 'vue' });
    expect(mockSetErrorHandlers).toHaveBeenCalledWith(
      expect.objectContaining({ onUnauthorized: expect.any(Function) }),
    );
  });

  it('calls setErrorHandlers with custom onUnauthorized when provided', () => {
    const onUnauthorized = vi.fn();
    setupErrorHandling({ type: 'vue', onUnauthorized });
    expect(mockSetErrorHandlers).toHaveBeenCalledWith({ onUnauthorized });
  });

  it('calls setErrorHandlers with empty object for type vitepress when onUnauthorized not provided', () => {
    setupErrorHandling({ type: 'vitepress' });
    expect(mockSetErrorHandlers).toHaveBeenCalledWith({});
  });

  it('calls setErrorLogger with sendReportedErrorToAnalytics', () => {
    setupErrorHandling({ type: 'vue' });
    expect(mockSetErrorLogger).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe('setupUnifiedErrorHandler', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  const listeners: { type: string; handler: (e: unknown) => void }[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    listeners.length = 0;
    addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation((type: string, handler: (e: unknown) => void) => {
      listeners.push({ type, handler });
    });
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  it('registers unhandledrejection and error listeners', () => {
    const result = setupUnifiedErrorHandler({ appType: 'vue' });
    expect(result).toBeDefined();
    result?.initialize();
    expect(listeners.some((l) => l.type === 'unhandledrejection')).toBe(true);
    expect(listeners.some((l) => l.type === 'error')).toBe(true);
  });

  it('calls reportError when unhandledrejection fires with non-ignorable error', () => {
    const result = setupUnifiedErrorHandler({ appType: 'vue' });
    result?.initialize();
    const rejection = listeners.find((l) => l.type === 'unhandledrejection');
    expect(rejection).toBeDefined();
    rejection!.handler({ reason: new Error('Real error') } as PromiseRejectionEvent);
    expect(mockReportError).toHaveBeenCalledWith(expect.any(Error), 'Something went wrong');
  });

  it('does not call reportError for ignorable ResizeObserver error', () => {
    const result = setupUnifiedErrorHandler({ appType: 'vue' });
    result?.initialize();
    const rejection = listeners.find((l) => l.type === 'unhandledrejection');
    rejection!.handler({ reason: new Error('ResizeObserver loop limit exceeded') } as PromiseRejectionEvent);
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('does not call reportError for ignorable AbortError', () => {
    const result = setupUnifiedErrorHandler({ appType: 'vue' });
    result?.initialize();
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    const rejection = listeners.find((l) => l.type === 'unhandledrejection');
    rejection!.handler({ reason: err } as PromiseRejectionEvent);
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('sets Vue app errorHandler when app is provided', () => {
    const errorHandler = vi.fn();
    const app = { config: { errorHandler } };
    const result = setupUnifiedErrorHandler({ appType: 'vue' });
    result?.initialize(app as never);
    const testError = new Error('Vue error');
    expect(app.config.errorHandler).toBeDefined();
    app.config.errorHandler!(testError, null, '');
    expect(mockReportError).toHaveBeenCalledWith(testError, 'Something went wrong');
  });
});
