// https://github.com/webdevelop-pro/dashboard.webdevelop.biz/issues/938
export function setupChunkErrorHandler(): void {
  if (typeof window !== 'undefined') {
    if ((window as any).__chunkErrorHandlerInstalled) {
      return;
    }
    (window as any).__chunkErrorHandlerInstalled = true;

    const oldErr = console.error;
    const CHUNK_RELOAD_KEY = 'chunk-error-last-reload';
    const CHUNK_RELOAD_COOLDOWN = 30 * 1000; // 30 seconds

    const isChunkAssetError = (msg: string) => {
      return msg.includes('/assets/')
        && (msg.includes('.js') || msg.includes('.css'));
    };

    const isDynamicImportError = (msg: string) => {
      // Cover Chrome + Firefox phrasing
      return msg.includes('Failed to fetch dynamically imported module:')
        || msg.includes('error loading dynamically imported module:')
        || msg.includes('Loading failed for the module with source');
    };

    const isServiceWorkerAssetError = (msg: string) => {
      return msg.includes('A ServiceWorker intercepted the request')
        && isChunkAssetError(msg);
    };

    const tryReloadOnce = () => {
      try {
        const lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
        const now = Date.now();
        if (Number.isNaN(lastReload) || now - lastReload > CHUNK_RELOAD_COOLDOWN) {
          window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
          window.location.reload();
          return;
        }
        
      } catch (storageError) {
        console.warn('chunkErrorHandler: sessionStorage is not accessible, reloading anyway.', storageError);
        window.location.reload();
        return;
      }
      oldErr('chunkErrorHandler: repeated chunk error detected, skip reload to avoid loop.');
    };

    console.error = function (...args: any[]) {
      if (args.length > 0) {
        const msg = String(args[0]);

        // Examples we want to catch (Chrome + Firefox):
        // - Failed to fetch dynamically imported module: https://.../assets/chunks/ViewHome...js
        // - TypeError: error loading dynamically imported module: https://.../assets/chunks/ViewHome...js
        // - Loading failed for the module with source "https://.../assets/chunks/ViewHome...js".
        // - Failed to load 'https://.../assets/chunks/ViewHome...js'. A ServiceWorker intercepted the request...
        if (isDynamicImportError(msg) && isChunkAssetError(msg)) {
          tryReloadOnce();
          return;
        }

        if (isServiceWorkerAssetError(msg)) {
          tryReloadOnce();
          return;
        }
      }
      oldErr.apply(console, args);
    };
  }
}
