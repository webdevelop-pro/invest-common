// https://github.com/webdevelop-pro/dashboard.webdevelop.biz/issues/938
//
// After a deploy, browsers holding the old HTML in cache request chunk
// filenames whose hashes no longer exist (e.g. `DashboardWallet-D4KASbBM.js`
// 404s). Vue's `defineAsyncComponent` / dynamic `import()` surface this as
// an unhandled promise rejection. Reload the page once so the browser pulls
// the new HTML + chunk references.
//
// Listeners we install:
//   1. `unhandledrejection`  — catches `import()` failures (the primary case)
//   2. `error` (capturing)   — catches <script>/<link> load failures
//   3. `console.error` patch — catches paths that explicitly log
//
// A sessionStorage cooldown prevents reload loops when the new build is
// also broken or the SW keeps serving stale references.
export function setupChunkErrorHandler(): void {
  if (typeof window === 'undefined') {
    return;
  }
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
      || msg.includes('Loading failed for the module with source')
      || msg.includes('Importing a module script failed');
  };

  const isServiceWorkerAssetError = (msg: string) => {
    return msg.includes('A ServiceWorker intercepted the request')
      && isChunkAssetError(msg);
  };

  const shouldReloadFromMessage = (msg: string) => {
    return (isDynamicImportError(msg) && isChunkAssetError(msg))
      || isServiceWorkerAssetError(msg);
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
    oldErr('chunkErrorHandler: repeated chunk error detected within 30s, skip reload to avoid loop.');
  };

  // 1. Unhandled promise rejection — the primary case for dynamic-import
  //    failures. `Failed to fetch dynamically imported module: …` lands here,
  //    not in console.error.
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason instanceof Error
      ? `${reason.message} ${reason.stack ?? ''}`
      : String(reason ?? '');
    if (shouldReloadFromMessage(msg)) {
      tryReloadOnce();
    }
  });

  // 2. Resource load errors — captured at the window level (capture: true)
  //    so we see <script src> and <link href> 404s that don't bubble.
  window.addEventListener(
    'error',
    (event) => {
      const target = event?.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      const src = (target as HTMLScriptElement).src
        ?? (target as HTMLLinkElement).href
        ?? '';
      if ((tag === 'script' || tag === 'link') && typeof src === 'string' && isChunkAssetError(src)) {
        tryReloadOnce();
      }
    },
    true,
  );

  // 3. Legacy console.error patch — kept for paths that explicitly log via
  //    console.error (some libraries do this for module-load failures).
  console.error = function (...args: any[]) {
    if (args.length > 0) {
      const msg = String(args[0]);
      if (shouldReloadFromMessage(msg)) {
        tryReloadOnce();
        return;
      }
    }
    oldErr.apply(console, args);
  };
}
