import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import {
  __resetPwaRegisterMock,
  __setPwaRegisterMockState,
} from 'virtual:pwa-register/vue';
import * as pwaUpdatePromptModule from 'InvestCommon/domain/pwa/usePwaUpdatePrompt';

const { usePwaUpdatePrompt } = pwaUpdatePromptModule;

type PwaUpdateResult = ReturnType<typeof usePwaUpdatePrompt>;
type ControllerChangeListener = EventListenerOrEventListenerObject;

const mountComposable = () => {
  let api!: PwaUpdateResult;
  const wrapper = mount(defineComponent({
    setup() {
      api = usePwaUpdatePrompt();
      return () => null;
    },
  }));

  return { wrapper, api };
};

const mockServiceWorkerContainer = () => {
  const listeners = new Set<ControllerChangeListener>();

  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      addEventListener: vi.fn((eventName: string, listener: ControllerChangeListener) => {
        if (eventName === 'controllerchange') {
          listeners.add(listener);
        }
      }),
      removeEventListener: vi.fn((eventName: string, listener: ControllerChangeListener) => {
        if (eventName === 'controllerchange') {
          listeners.delete(listener);
        }
      }),
    },
  });

  return {
    dispatchControllerChange() {
      const event = new Event('controllerchange');

      for (const listener of listeners) {
        if (typeof listener === 'function') {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      }
    },
  };
};

describe('usePwaUpdatePrompt', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?__pwa_test=1');
    __resetPwaRegisterMock();
    Reflect.deleteProperty(window.navigator, 'serviceWorker');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts idle when no offline-ready or update-ready state is present', () => {
    const { wrapper, api } = mountComposable();

    expect(api.lifecycleState.value).toBe('idle');
    expect(api.isOfflineReady.value).toBe(false);
    expect(api.isUpdateReady.value).toBe(false);

    wrapper.unmount();
  });

  it('surfaces offline-ready lifecycle from the service worker registration refs', async () => {
    __setPwaRegisterMockState({ offlineReady: true });
    const { wrapper, api } = mountComposable();
    await nextTick();

    expect(api.isOfflineReady.value).toBe(true);
    expect(api.lifecycleState.value).toBe('offlineReady');

    wrapper.unmount();
  });

  it('surfaces update-ready lifecycle from the service worker registration refs', async () => {
    __setPwaRegisterMockState({ needRefresh: true });
    const { wrapper, api } = mountComposable();
    await nextTick();

    expect(api.isUpdateReady.value).toBe(true);
    expect(api.lifecycleState.value).toBe('updateReady');

    wrapper.unmount();
  });

  it('switches to reloading state when refresh is accepted', async () => {
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    __setPwaRegisterMockState({
      needRefresh: true,
      updateServiceWorker,
    });
    const { wrapper, api } = mountComposable();

    await api.reloadApp();

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(api.lifecycleState.value).toBe('reloading');

    wrapper.unmount();
  });

  it('surfaces registration errors as a first-class lifecycle state', () => {
    __setPwaRegisterMockState({ shouldThrow: true });
    const { wrapper, api } = mountComposable();

    expect(api.lifecycleState.value).toBe('registrationError');
    expect(api.registrationError.value).toBeInstanceOf(Error);

    wrapper.unmount();
  });

  it('supports the localhost-only update-ready test hook', async () => {
    const { wrapper, api } = mountComposable();

    window.dispatchEvent(new Event('invest:pwa-test:update-ready'));
    await nextTick();

    expect(api.isUpdateReady.value).toBe(true);
    expect(api.lifecycleState.value).toBe('updateReady');

    wrapper.unmount();
  });

  it('falls back to a hard reload when the new worker does not claim the page in time', async () => {
    vi.useFakeTimers();
    mockServiceWorkerContainer();
    const reloadSpy = vi.spyOn(pwaUpdatePromptModule.pwaUpdatePromptRuntime, 'reloadCurrentPage')
      .mockImplementation(() => {});
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);

    __setPwaRegisterMockState({
      needRefresh: true,
      updateServiceWorker,
    });

    const { wrapper, api } = mountComposable();
    const reloadPromise = api.reloadApp();

    await vi.advanceTimersByTimeAsync(2_500);
    await reloadPromise;

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('skips the hard reload fallback when controllerchange fires promptly', async () => {
    vi.useFakeTimers();
    const serviceWorker = mockServiceWorkerContainer();
    const reloadSpy = vi.spyOn(pwaUpdatePromptModule.pwaUpdatePromptRuntime, 'reloadCurrentPage')
      .mockImplementation(() => {});
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);

    __setPwaRegisterMockState({
      needRefresh: true,
      updateServiceWorker,
    });

    const { wrapper, api } = mountComposable();
    const reloadPromise = api.reloadApp();

    serviceWorker.dispatchControllerChange();
    await reloadPromise;

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(reloadSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
