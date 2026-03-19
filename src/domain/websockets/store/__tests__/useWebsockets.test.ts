/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref } from 'vue';

const toastMock = vi.fn();
const useWebSocketMock = vi.fn();
const closeMock = vi.fn();
const socketData = ref<string | null>(null);
const socketStatus = ref('CLOSED');
const userLoggedIn = ref(false);

let latestSocketOptions: Record<string, any> | null = null;

const setNavigatorOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => online,
  });
};

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('@vueuse/core', () => ({
  useWebSocket: (...args: unknown[]) => useWebSocketMock(...args),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    NOTIFICATION_URL: 'https://notification.example.com',
  },
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
  }),
}));

vi.mock('InvestCommon/data/notifications/notifications.repository', () => ({
  useRepositoryNotifications: () => ({
    updateNotificationsData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    updateNotificationData: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/debug', () => ({
  debugLog: vi.fn(),
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

const loadStore = async () => {
  const { useDomainWebSocketStore } = await import('../useWebsockets');
  return useDomainWebSocketStore();
};

describe('useDomainWebSocketStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    setNavigatorOnline(true);
    userLoggedIn.value = true;
    socketData.value = null;
    socketStatus.value = 'CLOSED';
    latestSocketOptions = null;
    closeMock.mockImplementation(() => {
      socketStatus.value = 'CLOSED';
    });
    useWebSocketMock.mockImplementation((_uri: string, options: Record<string, any>) => {
      latestSocketOptions = options;
      socketStatus.value = 'OPEN';
      return {
        data: socketData,
        close: closeMock,
        status: socketStatus,
      };
    });
  });

  afterEach(async () => {
    userLoggedIn.value = false;
    await nextTick();
    vi.useRealTimers();
  });

  it('suppresses the retry toast when reconnect attempts fail offline', async () => {
    const store = await loadStore();

    await store.webSocketHandler();
    setNavigatorOnline(false);
    latestSocketOptions?.autoReconnect?.onFailed?.();

    expect(toastMock).not.toHaveBeenCalled();
  });

  it('shows the retry toast when reconnect attempts fail while online', async () => {
    const store = await loadStore();

    await store.webSocketHandler();
    latestSocketOptions?.autoReconnect?.onFailed?.();

    expect(toastMock).toHaveBeenCalledWith({
      title: 'Failed to connect WebSocket after 3 retries',
      variant: 'error',
    });
  });

  it('removes connectivity listeners after logout closes the socket', async () => {
    const store = await loadStore();

    await store.webSocketHandler();
    userLoggedIn.value = false;
    await nextTick();
    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(useWebSocketMock).toHaveBeenCalledTimes(1);
  });

  it('skips opening the websocket while the browser is offline', async () => {
    setNavigatorOnline(false);
    const store = await loadStore();

    await store.webSocketHandler();

    expect(useWebSocketMock).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });
});
