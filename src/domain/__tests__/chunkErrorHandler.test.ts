import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { setupChunkErrorHandler } from '../chunkErrorHandler';

describe('setupChunkErrorHandler', () => {
  const originalWindow = global.window as unknown;
  const originalConsoleError = console.error;

  let reloadMock: ReturnType<typeof vi.fn>;
  let getItemMock: ReturnType<typeof vi.fn>;
  let setItemMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloadMock = vi.fn();
    getItemMock = vi.fn().mockReturnValue(null);
    setItemMock = vi.fn();

    (global as any).window = {
      location: {
        reload: reloadMock,
      },
      sessionStorage: {
        getItem: getItemMock,
        setItem: setItemMock,
      },
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
});

