import { isPwaMobile } from "./pwaDetector";

type Listener = (e: Event) => void;

function insideAllowZone(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(".is--pwa-allow-zoom");
}

export function installPwaNoZoomGuards() {
  if (typeof window === "undefined") return;
  if (!isPwaMobile()) return;

  // Pinch/gesture iOS Safari
  const onGesture: Listener = (e) => {
    if (!insideAllowZone(e.target)) {
      e.preventDefault();
    }
  };

  // Touchmove (Android/Chrome)
  const onTouchMove = (e: TouchEvent) => {
    if (!insideAllowZone(e.target)) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }
  };

  // Double-tap zoom (iOS)
  let lastTouchEnd = 0;
  const onTouchEnd = (e: TouchEvent) => {
    if (insideAllowZone(e.target)) return;
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };

  // Ctrl/Meta + scroll
  const onWheel = (e: WheelEvent) => {
    if (!insideAllowZone(e.target) && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  // viewport for PWA, add 'user-scalable=no' to disable zooming even ".is--pwa-allow-zoom"
  const applyViewport = () => {
    let meta = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }

    meta.content =
      "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";
  };

  // disable Ctrl/Meta + '+'/'-'/'=' keys zooming
  const onKeyDown = (e: KeyboardEvent) => {
    if (!insideAllowZone(e.target) && (e.ctrlKey || e.metaKey)) {
      const k = e.key;
      if (k === '+' || k === '=' || k === '-' || k === '_') e.preventDefault();
    }
  };

  applyViewport();

  document.addEventListener("gesturestart", onGesture, { passive: false });
  document.addEventListener("gesturechange", onGesture, { passive: false });
  document.addEventListener("gestureend", onGesture, { passive: false });

  document.addEventListener("touchmove", onTouchMove as EventListener, {
    passive: false,
  });
  document.addEventListener("touchend", onTouchEnd as EventListener, {
    passive: false,
  });

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown, { passive: false });

  return () => {
    document.removeEventListener("gesturestart", onGesture as EventListener);
    document.removeEventListener("gesturechange", onGesture as EventListener);
    document.removeEventListener("gestureend", onGesture as EventListener);
    document.removeEventListener("touchmove", onTouchMove as EventListener);
    document.removeEventListener("touchend", onTouchEnd as EventListener);
    window.removeEventListener("wheel", onWheel as EventListener);
  };
}
