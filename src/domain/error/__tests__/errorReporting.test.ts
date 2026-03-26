import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeError,
  reportError,
  reportOfflineReadError,
  toasterErrorHandling,
  setErrorLogger,
  setErrorHandlers,
  setErrorReporter,
} from '../errorReporting';

const mockToast = vi.fn();
const mockShowGlobalAlert = vi.fn();
vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
    TOAST_REMOVE_DELAY: 10000,
  })),
}));

vi.mock('UiKit/store/useGlobalAlert', () => ({
  useGlobalAlert: () => ({
    show: mockShowGlobalAlert,
  }),
}));

describe('normalizeError', () => {
  it('returns fallback message for Error with empty message', () => {
    const err = new Error('');
    expect(normalizeError(err, 'Fallback')).toEqual({ message: 'Fallback' });
  });

  it('returns error.message for Error instance', () => {
    const err = new Error('Something broke');
    expect(normalizeError(err, 'Fallback')).toEqual({ message: 'Something broke' });
  });

  it('returns fallback for non-object', () => {
    expect(normalizeError(null, 'Fallback')).toEqual({ message: 'Fallback' });
    expect(normalizeError(42, 'Fallback')).toEqual({ message: 'Fallback' });
  });

  it('extracts message from object with message property', () => {
    expect(normalizeError({ message: 'Custom' }, 'Fallback')).toEqual({ message: 'Custom' });
  });

  it('extracts message and statusCode from data.responseJson and data.statusCode (APIError shape)', () => {
    const err = {
      data: {
        statusCode: 401,
        responseJson: { __error__: 'Unauthorized', message: 'Session expired' },
      },
    };
    expect(normalizeError(err, 'Fallback')).toEqual({
      message: 'Unauthorized',
      code: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('extracts statusCode from data.status when data.statusCode is missing', () => {
    const err = {
      data: { status: 429, responseJson: {} },
    };
    expect(normalizeError(err, 'Fallback')).toMatchObject({ statusCode: 429 });
  });

  it('extracts message from data.responseJson.message when __error__ is missing', () => {
    const err = {
      data: { responseJson: { message: 'Rate limited' } },
    };
    expect(normalizeError(err, 'Fallback')).toMatchObject({ message: 'Rate limited' });
  });

  it('joins array __error__ messages', () => {
    const err = {
      data: { responseJson: { __error__: ['Error A', 'Error B'] } },
    };
    expect(normalizeError(err, 'Fallback')).toMatchObject({ message: 'Error A; Error B' });
  });
});

describe('reportError', () => {
  const mockReporter = vi.fn();
  const mockLogger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    setErrorReporter(null);
    setErrorLogger(null);
    setErrorHandlers({});
  });

  afterEach(() => {
    setErrorReporter(null);
    setErrorLogger(null);
  });

  it('calls custom reporter when set', () => {
    setErrorReporter(mockReporter);
    reportError(new Error('test'), 'Fallback');
    expect(mockReporter).toHaveBeenCalledTimes(1);
    const [errorArg, fallback] = mockReporter.mock.calls[0];
    expect(errorArg).toEqual(expect.any(Error));
    expect(fallback).toBe('Fallback');
  });

  it('uses default reporter when setErrorReporter(null)', () => {
    setErrorReporter(null);
    setErrorLogger(mockLogger);
    reportError(new Error('err'), 'Fallback');
    expect(mockLogger).toHaveBeenCalledTimes(1);
    const [normalized, fallback] = mockLogger.mock.calls[0];
    expect(normalized).toEqual(expect.objectContaining({ message: 'err' }));
    expect(fallback).toBe('Fallback');
  });

  it('calls onUnauthorized for 401 and does not toast', () => {
    const onUnauthorized = vi.fn();
    setErrorHandlers({ onUnauthorized });
    setErrorLogger(mockLogger);
    const err = { data: { statusCode: 401, responseJson: {} } };
    reportError(err, 'Fallback');
    expect(mockLogger).toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('calls onRateLimited and shows rate-limit toast for 429', () => {
    const onRateLimited = vi.fn();
    setErrorHandlers({ onRateLimited });
    setErrorLogger(mockLogger);
    const err = { data: { statusCode: 429, responseJson: {} } };
    reportError(err, 'Fallback');
    expect(mockLogger).toHaveBeenCalled();
    expect(onRateLimited).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 429 }),
    );
  });

  it('never throws when reporter throws', () => {
    setErrorReporter(() => {
      throw new Error('reporter threw');
    });
    expect(() => reportError(new Error('x'), 'Fallback')).not.toThrow();
  });

  it('suppresses background read errors while the browser is offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    setErrorLogger(mockLogger);
    reportOfflineReadError(new Error('offline miss'), 'Failed to load offers');

    expect(mockLogger).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('suppresses fetch-style offline misses even when navigator still reports online', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    setErrorLogger(mockLogger);
    reportOfflineReadError(new Error('Failed to fetch'), 'Failed to load offers');

    expect(mockLogger).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });
});

describe('toasterErrorHandling', () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockShowGlobalAlert.mockClear();
  });

  it('calls toast with normalized message and fallback title', () => {
    toasterErrorHandling(new Error('Network error'), 'Oops');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Oops',
        description: 'Network error',
        variant: 'error',
      }),
    );
  });

  it('uses default title when fallbackMessage is empty', () => {
    toasterErrorHandling(new Error('x'), '');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Something went wrong',
        description: 'x',
      }),
    );
  });
});

describe('setErrorLogger / setErrorHandlers', () => {
  beforeEach(() => {
    setErrorLogger(null);
    setErrorHandlers({});
    mockToast.mockClear();
    mockShowGlobalAlert.mockClear();
  });

  it('setErrorHandlers merges with existing handlers', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    setErrorHandlers({ onUnauthorized: fn1 });
    setErrorHandlers({ onRateLimited: fn2 });
    setErrorLogger(vi.fn());
    reportError({ data: { statusCode: 401 } }, 'F');
    reportError({ data: { statusCode: 429 } }, 'F');
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('shows global alert instead of toast for non-fatal 5xx core requests', () => {
    const error = {
      data: { statusCode: 502, responseJson: { message: 'Upstream error' } },
      // simulate ApiClient default: non-fatal but opted-in for global alert
      showGlobalAlertOnServerError: true,
    };
    setErrorLogger(vi.fn());
    reportError(error, 'Fallback');

    expect(mockShowGlobalAlert).toHaveBeenCalledTimes(1);
    const [args] = mockShowGlobalAlert.mock.calls[0];
    expect(args.variant).toBe('error');
    expect(args.title).toContain('technical issues');
    expect(args.message).toContain('status 502');
    expect(args.message).toContain('Upstream error');
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('forwards stack context to logger when available', () => {
    const logger = vi.fn();
    setErrorLogger(logger);
    const error = new Error('boom');

    reportError(error, 'Fallback');

    expect(logger).toHaveBeenCalledTimes(1);
    const [, , context] = logger.mock.calls[0];
    if (!context || typeof context !== 'object') {
      throw new Error('Expected context object to be passed to logger');
    }
    const stack = (context as { stack?: unknown }).stack;
    expect(Array.isArray(stack)).toBe(true);
    expect((stack as unknown[]).length).toBeGreaterThan(0);
  });
});
