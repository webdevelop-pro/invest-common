import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { setupChunkErrorHandler } from '../chunkErrorHandler';

describe('setupChunkErrorHandler', () => {
  const originalWindow = global.window as unknown;
  const originalConsoleError = console.error;

  let reloadMock: ReturnType<typeof vi.fn>;
  let getItemMock: ReturnType<typeof vi.fn>;
  let setItemMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let listeners: Record<string, Array<(event: any) => void>>;

  beforeEach(() => {
    reloadMock = vi.fn();
    getItemMock = vi.fn().mockReturnValue(null);
    setItemMock = vi.fn();
    listeners = {};
    addEventListenerMock = vi.fn((type: string, handler: (event: any) => void) => {
      listeners[type] ??= [];
      listeners[type].push(handler);
    });

    (global as any).window = {
      location: {
        reload: reloadMock,
      },
      sessionStorage: {
        getItem: getItemMock,
        setItem: setItemMock,
      },
      addEventListener: addEventListenerMock,
    };

    (console as any).error = vi.fn();
    (console as any).warn = vi.fn();

    // Ensure flag is reset between tests
    (window as any).__chunkErrorHandlerInstalled = undefined;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    console.error = originalConsoleError;
  });

  it('reloads once for dynamic import chunk error', () => {
    setupChunkErrorHandler();

    const msg =
      'TypeError: error loading dynamically imported module: https://example.com/assets/chunks/ViewHome.ABC123.js';

    console.error(msg as unknown as Error);

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when called multiple times', () => {
    setupChunkErrorHandler();
    const firstWrappedError = console.error;

    // Calling again should be a no-op
    setupChunkErrorHandler();
    const secondWrappedError = console.error;

    expect(secondWrappedError).toBe(firstWrappedError);
  });

  it('reloads on unhandledrejection for failed dynamic import', () => {
    // Regression: deployed dashboard surfaces stale chunk hashes as
    // `Uncaught (in promise) TypeError: Failed to fetch dynamically
    // imported module: …` — that's an unhandledrejection event, NOT a
    // console.error call. The old handler missed it.
    setupChunkErrorHandler();

    const rejectionHandler = listeners.unhandledrejection?.[0];
    expect(rejectionHandler).toBeDefined();

    rejectionHandler!({
      reason: new TypeError(
        'Failed to fetch dynamically imported module: https://example.com/dashboard/assets/DashboardWallet-ABC.js',
      ),
    });

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('reloads on a script tag 404 for a hashed chunk', () => {
    setupChunkErrorHandler();

    const errorHandler = listeners.error?.[0];
    expect(errorHandler).toBeDefined();

    errorHandler!({
      target: {
        tagName: 'SCRIPT',
        src: 'https://example.com/dashboard/assets/chunk-vue-XYZ.js',
      },
    });

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

