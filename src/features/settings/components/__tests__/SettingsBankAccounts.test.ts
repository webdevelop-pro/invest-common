import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SettingsBankAccounts from '../SettingsBankAccounts.vue';

const walletAlertState = vi.hoisted(() => ({
  isDataLoadingValue: false,
  onAlertButtonClick: vi.fn(),
}));

vi.mock('InvestCommon/features/settings/components/logic/useSettingsBankAccounts', () => ({
  useSettingsBankAccounts: () => ({
    fundingSource: computed(() => []),
    isCanAddBankAccount: computed(() => true),
    isLinkBankAccountLoading: computed(() => false),
    deleteLinkedAccountState: computed(() => ({ loading: false })),
    onAddAccountClick: vi.fn(),
    onDeleteAccountClick: vi.fn(),
    showSkeletonPlaceholders: computed(() => false),
    skeletonItemCount: 2,
  }),
}));

vi.mock('InvestCommon/features/wallet/logic/useWalletAlert', () => ({
  useWalletAlert: () => ({
    isAlertShow: computed(() => true),
    isDataLoading: computed(() => walletAlertState.isDataLoadingValue),
    isAlertType: computed(() => 'error' as const),
    isAlertText: computed(() => 'Temporary wallet issue'),
    alertTitle: computed(() => 'Wallet error'),
    alertButtonText: computed(() => undefined),
    onAlertButtonClick: walletAlertState.onAlertButtonClick,
  }),
}));

describe('SettingsBankAccounts', () => {
  it('hides the wallet alert while wallet data is still loading', () => {
    walletAlertState.isDataLoadingValue = true;

    const wrapper = mount(SettingsBankAccounts, {
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: '<div data-testid="wallet-alert"><slot name="title" /><slot name="description" /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
          VInfoBankAccountItem: {
            template: '<div data-testid="bank-account-item" />',
          },
          plus: {
            template: '<svg />',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="wallet-alert"]').exists()).toBe(false);
  });

  it('shows the wallet alert after loading finishes', () => {
    walletAlertState.isDataLoadingValue = false;

    const wrapper = mount(SettingsBankAccounts, {
      global: {
        directives: {
          dompurifyHtml: (element, binding) => {
            element.innerHTML = binding.value;
          },
        },
        stubs: {
          VAlert: {
            template: '<div data-testid="wallet-alert"><slot name="title" /><slot name="description" /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
          VInfoBankAccountItem: {
            template: '<div data-testid="bank-account-item" />',
          },
          plus: {
            template: '<svg />',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="wallet-alert"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Wallet error');
  });
});
