import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import VPwaStatusStack from 'InvestCommon/shared/components/pwa/VPwaStatusStack.vue';

const isStandalone = ref(false);
const canInstall = ref(false);
const installState = ref<'hidden' | 'native' | 'manual-ios'>('hidden');
const isUpdateReady = ref(false);
const isOfflineReady = ref(false);
const lifecycleState = ref<'idle' | 'offlineReady' | 'updateReady' | 'reloading' | 'registrationError'>('idle');
const registrationError = ref<unknown>(null);
const isOffline = ref(false);
const isReconnected = ref(false);
const isShowingCachedContent = ref(false);
const lastSyncedAt = ref<string | null>(null);

vi.mock('InvestCommon/domain/pwa/usePwaStandalone', () => ({
  usePwaStandalone: () => ({
    isStandalone,
  }),
}));

vi.mock('InvestCommon/domain/pwa/usePwaInstallPrompt', () => ({
  usePwaInstallPrompt: () => ({
    canInstall,
    installState,
    promptInstall: vi.fn(),
    dismissInstallPrompt: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/pwa/usePwaUpdatePrompt', () => ({
  usePwaUpdatePrompt: () => ({
    isUpdateReady,
    isOfflineReady,
    lifecycleState,
    registrationError,
    reloadApp: vi.fn(),
    dismissOfflineReady: vi.fn(),
    dismissUpdateReady: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/pwa/useOfflineStatus', () => ({
  useOfflineStatus: () => ({
    isOffline,
    isReconnected,
    isShowingCachedContent,
  }),
}));

vi.mock('InvestCommon/domain/pwa/usePwaOfflineDataStatus', () => ({
  usePwaOfflineDataStatus: () => ({
    lastSyncedAt,
  }),
}));

vi.mock('InvestCommon/domain/pwa/usePwaTelemetry', () => ({
  usePwaTelemetry: () => ({
    handleInstall: vi.fn(),
    handleDismissInstall: vi.fn(),
    handleReloadApp: vi.fn(),
    handleDismissUpdate: vi.fn(),
    handleDismissOfflineReady: vi.fn(),
  }),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    APP_VERSION: 'test-build',
  },
}));

const mountStatusStack = (props: Record<string, unknown> = {}) => mount(VPwaStatusStack, {
  props: {
    usesMobileShell: false,
    hasFooterMenu: false,
    ...props,
  },
  global: {
    stubs: {
      VPwaInstallPrompt: {
        template: '<div data-testid="install-prompt" />',
      },
      VPwaUpdatePrompt: {
        template: '<div data-testid="update-prompt" />',
      },
      VOfflineStatusBanner: {
        template: '<div data-testid="offline-banner" />',
      },
    },
  },
});

describe('VPwaStatusStack', () => {
  beforeEach(() => {
    isStandalone.value = false;
    canInstall.value = false;
    installState.value = 'hidden';
    isUpdateReady.value = false;
    isOfflineReady.value = false;
    lifecycleState.value = 'idle';
    registrationError.value = null;
    isOffline.value = false;
    isReconnected.value = false;
    isShowingCachedContent.value = false;
    lastSyncedAt.value = null;
  });

  it('hides update prompt on regular web sessions while keeping offline banner available', () => {
    isUpdateReady.value = true;
    isOffline.value = true;

    const wrapper = mountStatusStack();

    expect(wrapper.find('[data-testid="update-prompt"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(true);
  });

  it('keeps the install prompt visible on the web without showing update prompt', () => {
    installState.value = 'native';
    canInstall.value = true;
    isUpdateReady.value = true;
    isOffline.value = true;

    const wrapper = mountStatusStack();

    expect(wrapper.find('.v-pwa-status-stack').exists()).toBe(true);
    expect(wrapper.find('[data-testid="install-prompt"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="update-prompt"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(true);
  });

  it('shows runtime PWA alerts inside standalone sessions', () => {
    isStandalone.value = true;
    isUpdateReady.value = true;
    isOffline.value = true;

    const wrapper = mountStatusStack({
      usesMobileShell: true,
      hasFooterMenu: true,
    });

    expect(wrapper.find('[data-testid="update-prompt"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(true);
    expect(wrapper.find('.v-pwa-status-stack').classes()).toContain('is--footer-offset');
  });

  it('pins the stack to the viewport bottom when the footer menu is hidden', () => {
    isOffline.value = true;

    const wrapper = mountStatusStack({
      usesMobileShell: true,
      hasFooterMenu: false,
    });

    expect(wrapper.find('.v-pwa-status-stack').classes()).not.toContain('is--footer-offset');
  });
});
