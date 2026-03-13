import { onBeforeUnmount, onMounted, watch } from 'vue';
import { installPwaNoZoomGuards } from 'InvestCommon/domain/pwa/disableZoom';
import { isPwaMobile } from 'InvestCommon/domain/pwa/pwaDetector';
import { useMobileAppShell } from 'InvestCommon/domain/mobile/useMobileAppShell';

type UseMobileLayoutOptions = {
  shellClassNames?: string[];
};

export function useMobileLayout(options: UseMobileLayoutOptions = {}) {
  const {
    shellClassNames = ['mobile-app-shell', 'pwa-mobile'],
  } = options;

  const { usesMobileAppShell } = useMobileAppShell();

  let removeNoZoomGuards: (() => void) | undefined;

  const syncShellClassName = (enabled: boolean) => {
    if (typeof document === 'undefined') {
      return;
    }

    shellClassNames.forEach((className) => {
      document.body.classList.toggle(className, enabled);
      document.documentElement.classList.toggle(className, enabled);
    });
  };

  onMounted(() => {
    if (isPwaMobile()) {
      removeNoZoomGuards = installPwaNoZoomGuards();
    }
  });

  onBeforeUnmount(() => {
    removeNoZoomGuards?.();
    removeNoZoomGuards = undefined;

    syncShellClassName(false);
  });

  watch(
    usesMobileAppShell,
    (usesMobileShell) => {
      syncShellClassName(usesMobileShell);
    },
    { immediate: true },
  );

  return {
    usesMobileShell: usesMobileAppShell,
  };
}
