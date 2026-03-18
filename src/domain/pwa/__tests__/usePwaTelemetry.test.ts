import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';

const sendEvent = vi.fn();

vi.mock('InvestCommon/domain/analytics/useSendAnalyticsEvent', () => ({
  useSendAnalyticsEvent: () => ({
    sendEvent,
  }),
}));

import { usePwaTelemetry } from 'InvestCommon/domain/pwa/usePwaTelemetry';

describe('usePwaTelemetry', () => {
  beforeEach(() => {
    sendEvent.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks install prompt visibility for both native and manual install states', async () => {
    const installState = ref<'hidden' | 'native' | 'manual-ios'>('hidden');

    const wrapper = mount(defineComponent({
      setup() {
        usePwaTelemetry({
          canInstall: ref(false),
          installState,
          isUpdateReady: ref(false),
          isOfflineReady: ref(false),
          isOffline: ref(false),
          isReconnected: ref(false),
          registrationError: ref(null),
          promptInstall: async () => null,
          dismissInstallPrompt: vi.fn(),
          reloadApp: async () => {},
          dismissUpdateReady: vi.fn(),
          dismissOfflineReady: vi.fn(),
        });
        return () => null;
      },
    }));

    installState.value = 'manual-ios';
    await nextTick();

    expect(sendEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'pwa_install_prompt_shown',
    }));

    wrapper.unmount();
  });

  it('tracks service-worker registration failures', async () => {
    const registrationError = ref<unknown>(null);

    const wrapper = mount(defineComponent({
      setup() {
        usePwaTelemetry({
          canInstall: ref(false),
          installState: ref('hidden'),
          isUpdateReady: ref(false),
          isOfflineReady: ref(false),
          isOffline: ref(false),
          isReconnected: ref(false),
          registrationError,
          promptInstall: async () => null,
          dismissInstallPrompt: vi.fn(),
          reloadApp: async () => {},
          dismissUpdateReady: vi.fn(),
          dismissOfflineReady: vi.fn(),
        });
        return () => null;
      },
    }));

    registrationError.value = new Error('boom');
    await nextTick();

    expect(sendEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'pwa_sw_registration_failed',
      status_code: 500,
      httpRequestUrl: 'pwa://service-worker/register',
    }));

    wrapper.unmount();
  });
});
