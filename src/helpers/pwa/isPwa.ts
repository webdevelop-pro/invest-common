export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // Android/Chrome
  if (
    window.matchMedia &&
    window.matchMedia("(display-mode: standalone)").matches
  )
    return true;
  // iOS Safari
  // @ts-ignore
  if (typeof navigator !== "undefined" && (navigator as any).standalone)
    return true;

  if (
    window.matchMedia &&
    window.matchMedia("(display-mode: window-controls-overlay)").matches
  )
    return true;
  return false;
}
