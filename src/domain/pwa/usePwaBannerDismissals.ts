import {
  computed,
  shallowRef,
  watch,
  type Ref,
} from 'vue';

export type PwaBannerDismissalKey =
  | 'offline'
  | 'reconnected';

export function usePwaBannerDismissals(activeBannerKey: Ref<PwaBannerDismissalKey | null>) {
  const dismissedBannerKey = shallowRef<PwaBannerDismissalKey | null>(null);

  watch(activeBannerKey, (nextBannerKey, previousBannerKey) => {
    if (nextBannerKey !== previousBannerKey) {
      dismissedBannerKey.value = null;
    }
  });

  const isBannerVisible = computed(() => (
    activeBannerKey.value != null
    && activeBannerKey.value !== dismissedBannerKey.value
  ));

  const dismissActiveBanner = () => {
    dismissedBannerKey.value = activeBannerKey.value;
  };

  return {
    isBannerVisible,
    dismissActiveBanner,
  };
}
