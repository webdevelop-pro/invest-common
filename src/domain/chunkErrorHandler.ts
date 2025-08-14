// https://github.com/webdevelop-pro/dashboard.webdevelop.biz/issues/938
export function setupChunkErrorHandler(): void {
  if (typeof window !== 'undefined') {
    const oldErr = console.error;
    console.error = function (...args: any[]) {
      // /assets/chunks/ViewErrors.B98_KOXD.js
      if (args.length > 0) {
        const msg = args[0].toString();
        if (
          msg.indexOf('Failed to fetch dynamically imported module:') !== -1
            && msg.indexOf('/assets/chunks/') !== -1
            && msg.indexOf('.js') !== -1) {
          window.location.reload();
        } else if (
          msg.indexOf('A ServiceWorker intercepted the request') !== -1
            && msg.indexOf('/assets/chunks/') !== -1
            && msg.indexOf('.js') !== -1) {
          window.location.reload();
        }
      } else {
        oldErr.apply(console, args);
      }
    };
  }
}
