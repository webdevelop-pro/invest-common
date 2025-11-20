// https://github.com/webdevelop-pro/dashboard.webdevelop.biz/issues/938
export function setupChunkErrorHandler(): void {
  if (typeof window !== 'undefined') {
    const oldErr = console.error;
    const CHUNK_RELOAD_KEY = 'chunk-error-last-reload';
    const CHUNK_RELOAD_COOLDOWN = 30 * 1000; // 30 seconds

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
      // /assets/chunks/ViewErrors.B98_KOXD.js
      if (args.length > 0) {
        const msg = args[0].toString();
        if (
          msg.indexOf('Failed to fetch dynamically imported module:') !== -1
            && msg.indexOf('/assets/chunks/') !== -1
            && msg.indexOf('.js') !== -1) {
          tryReloadOnce();
          return;
        } else if (
          msg.indexOf('A ServiceWorker intercepted the request') !== -1
            && msg.indexOf('/assets/chunks/') !== -1
            && msg.indexOf('.js') !== -1) {
          tryReloadOnce();
          return;
        }
      }
      oldErr.apply(console, args);
    };
  }
}
