import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  nextTick,
  ref,
} from 'vue';
import { usePwaBannerDismissals } from '../usePwaBannerDismissals';

describe('usePwaBannerDismissals', () => {
  it('hides the active banner after dismissal', () => {
    const activeBannerKey = ref<'offline' | 'reconnected' | null>('offline');
    const api = usePwaBannerDismissals(activeBannerKey);

    expect(api.isBannerVisible.value).toBe(true);

    api.dismissActiveBanner();

    expect(api.isBannerVisible.value).toBe(false);
  });

  it('shows a new banner state after the active key changes', async () => {
    const activeBannerKey = ref<'offline' | 'reconnected' | null>('offline');
    const api = usePwaBannerDismissals(activeBannerKey);

    api.dismissActiveBanner();
    expect(api.isBannerVisible.value).toBe(false);

    activeBannerKey.value = null;
    await nextTick();
    activeBannerKey.value = 'reconnected';
    await nextTick();

    expect(api.isBannerVisible.value).toBe(true);
  });
});
