function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  // iOS Safari standalone
  // @ts-ignore
  if (typeof navigator !== "undefined" && (navigator as any).standalone) {
    return true;
  }

  // Chrome/Edge
  if (window.matchMedia) {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: window-controls-overlay)").matches)
      return true;
  }

  return false;
}

function isMobilePhone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|iphone/.test(ua);
}

export function isPwaMobile(): boolean {
  return isPWA() && isMobilePhone();
}
