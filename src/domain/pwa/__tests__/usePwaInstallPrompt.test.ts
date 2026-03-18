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
import { usePwaInstallPrompt } from 'InvestCommon/domain/pwa/usePwaInstallPrompt';

const INSTALL_PROMPT_DISMISS_KEY = 'invest:pwa-install-prompt:dismissed-at';

type InstallPromptResult = ReturnType<typeof usePwaInstallPrompt>;

const createMatchMedia = (matches = false) => vi.fn().mockImplementation(() => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

const setUserAgent = (value: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value,
  });
};

const setStandaloneNavigator = (value?: boolean) => {
  Object.defineProperty(window.navigator, 'standalone', {
    configurable: true,
    value,
  });
};

const mountComposable = () => {
  let api!: InstallPromptResult;
  const wrapper = mount(defineComponent({
    setup() {
      api = usePwaInstallPrompt();
      return () => null;
    },
  }));

  return { wrapper, api };
};

const dispatchBeforeInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = new Event('beforeinstallprompt');
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({
      outcome,
      platform: 'web',
    }),
  });
  window.dispatchEvent(event);
  return { event, prompt };
};

describe('usePwaInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: createMatchMedia(false),
    });
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    setStandaloneNavigator(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the native install prompt after beforeinstallprompt fires and hides it after acceptance', async () => {
    const { wrapper, api } = mountComposable();

    const { prompt } = dispatchBeforeInstallPrompt('accepted');
    await nextTick();

    expect(api.installState.value).toBe('native');
    expect(api.canInstall.value).toBe(true);

    await expect(api.promptInstall()).resolves.toBe('accepted');
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(api.installState.value).toBe('hidden');
    expect(api.canInstall.value).toBe(false);

    wrapper.unmount();
  });

  it('persists dismissal cooldown after the native prompt is dismissed', async () => {
    const firstMount = mountComposable();

    dispatchBeforeInstallPrompt('dismissed');
    await nextTick();
    await expect(firstMount.api.promptInstall()).resolves.toBe('dismissed');
    expect(localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY)).toBeTruthy();

    firstMount.wrapper.unmount();

    const secondMount = mountComposable();
    dispatchBeforeInstallPrompt('accepted');
    await nextTick();

    expect(secondMount.api.installState.value).toBe('hidden');
    expect(secondMount.api.canInstall.value).toBe(false);

    secondMount.wrapper.unmount();
  });

  it('shows the manual iOS install guidance when Safari does not expose beforeinstallprompt', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    );

    const { wrapper, api } = mountComposable();

    expect(api.installState.value).toBe('manual-ios');
    expect(api.showManualInstall.value).toBe(true);
    expect(api.canInstall.value).toBe(false);

    wrapper.unmount();
  });

  it('ignores localStorage read failures and keeps the prompt logic usable', async () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const { wrapper, api } = mountComposable();
    dispatchBeforeInstallPrompt('accepted');
    await nextTick();

    expect(api.installState.value).toBe('native');
    await expect(api.promptInstall()).resolves.toBe('accepted');

    wrapper.unmount();
  });
});
