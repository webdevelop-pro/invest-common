import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  computed,
  ref,
} from 'vue';
import { formatKycThirdPartyScreen } from 'InvestCommon/data/kyc/formatter/kycThirdPartyScreen.formatter';
import ViewKycThirdParty from '../ViewKycThirdParty.vue';
import type { KycThirdPartyStatus } from '../logic/useKycThirdParty';

const hide = vi.fn();
const launch = vi.fn().mockResolvedValue(undefined);
const status = ref<KycThirdPartyStatus>('idle');

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: () => ({
    hide,
  }),
}));

vi.mock('../logic/useKycThirdParty', () => ({
  useKycThirdParty: () => ({
    launch,
    screen: computed(() => formatKycThirdPartyScreen(status.value)),
    status,
  }),
}));

describe('ViewKycThirdParty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    status.value = 'idle';
  });

  it('hides the global loader and launches the third-party flow on mount', () => {
    mount(ViewKycThirdParty);

    expect(hide).toHaveBeenCalledTimes(1);
    expect(launch).toHaveBeenCalledTimes(1);
  });

  it('renders the success copy when the flow succeeds', () => {
    status.value = 'success';
    const wrapper = mount(ViewKycThirdParty);

    expect(wrapper.text()).toContain('Thank you for completing KYC');
    expect(wrapper.text()).toContain('Your KYC process is now complete.');
  });

  it('renders a generic fallback message for non-success terminal states', () => {
    status.value = 'error';
    const wrapper = mount(ViewKycThirdParty);

    expect(wrapper.text()).toContain('We could not complete identity verification');
    expect(wrapper.text()).toContain('Please retry from the original verification link.');
  });

  it('renders the loading copy while the third-party flow is opening', () => {
    status.value = 'launching';
    const wrapper = mount(ViewKycThirdParty);

    expect(wrapper.text()).toContain('Opening identity verification');
    expect(wrapper.text()).toContain('Please wait while we connect you to our verification partner.');
  });
});
