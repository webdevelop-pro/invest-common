import { computed } from 'vue';

import { isPwaMobile } from 'InvestCommon/domain/pwa/pwaDetector';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

export function useMobileAppShell() {
  const { isTablet } = useBreakpoints();

  const usesMobileAppShell = computed(() => isPwaMobile() || isTablet.value);

  return {
    usesMobileAppShell,
  };
}
