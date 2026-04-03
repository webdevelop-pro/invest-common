import { computed, onMounted, shallowRef } from 'vue';

import { isPwaMobile } from 'InvestCommon/domain/pwa/pwaDetector';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

export function useMobileAppShell() {
  const { isTablet } = useBreakpoints();
  const isClientReady = shallowRef(false);

  onMounted(() => {
    isClientReady.value = true;
  });

  const usesMobileAppShell = computed(() => {
    if (!isClientReady.value) {
      return false;
    }

    return isPwaMobile() || isTablet.value;
  });

  return {
    usesMobileAppShell,
  };
}
