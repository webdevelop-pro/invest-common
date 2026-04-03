import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { InvestKycTypes } from 'InvestCommon/data/kyc/kyc.types';
import { DashboardTabTypes } from '../../utils';
import DashboardPageHeader from '../DashboardPageHeader.vue';

const selectedUserProfileData = ref<any>(null);
const openContactUsDialog = vi.fn();
const onKycClick = vi.fn();
const onAccreditationClick = vi.fn();
const onKycAlertDescriptionClick = vi.fn();
const onAccreditationAlertDescriptionClick = vi.fn();
const totalBalanceMainFormatted = ref('$12,345');
const totalBalanceCoins = ref('.67');
const isWalletDataLoading = ref(false);
const kycDataAlert = ref({
  title: '',
  description: '',
  buttonText: '',
});
const accreditationDataAlert = ref({
  title: '',
  description: '',
  buttonText: '',
});

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      if ('selectedUserProfileData' in store) {
        return { selectedUserProfileData };
      }
      if ('dataAlert' in store) {
        if ('onClick' in store && store.onClick === onKycClick) {
          return { dataAlert: kycDataAlert };
        }
        return { dataAlert: accreditationDataAlert };
      }

      return {};
    },
  };
});

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData,
  }),
}));

vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: () => ({
    openContactUsDialog,
  }),
}));

vi.mock('InvestCommon/features/kyc/store/useKycStatus', () => ({
  useKycStatus: () => ({
    dataAlert: kycDataAlert,
    onClick: onKycClick,
    onAlertDescriptionClick: onKycAlertDescriptionClick,
  }),
}));

vi.mock('InvestCommon/features/accreditation/store/useAccreditationStatus', () => ({
  useAccreditationStatus: () => ({
    dataAlert: accreditationDataAlert,
    onClick: onAccreditationClick,
    onAlertDescriptionClick: onAccreditationAlertDescriptionClick,
  }),
}));

vi.mock('InvestCommon/features/wallet/logic/useWallet', () => ({
  useWallet: () => ({
    totalBalanceMainFormatted,
    totalBalanceCoins,
    isWalletDataLoading,
  }),
}));

const mountHeader = (activeTab = DashboardTabTypes.summary) => mount(DashboardPageHeader, {
  props: {
    activeTab,
    tabTopLeftComponents: {},
  },
  global: {
    directives: {
      dompurifyHtml: (element, binding) => {
        element.innerHTML = binding.value;
      },
    },
    stubs: {
      DashboardPageHeaderLeft: {
        props: ['activeTab'],
        emits: ['info-cta-click'],
        template: `
          <div class="dashboard-page-header-left-stub">
            <div v-if="activeTab === 'summary'">Overview</div>
            <div v-else-if="activeTab === 'portfolio'">Portfolio Overview</div>
            <button
              v-else-if="activeTab === 'acount'"
              class="is--link-2"
              type="button"
              @click="$emit('info-cta-click')"
            >
              Need help?
            </button>
            <div v-else-if="activeTab === 'wallet'">
              Total Balance: <span>$12,345</span><span>.67</span>
            </div>
          </div>
        `,
      },
      DashboardTopInfoRight: {
        template: '<div data-testid="performance-cards" />',
      },
      VAlert: {
        props: ['variant', 'buttonText'],
        emits: ['click'],
        template: `
          <div
            class="alert-stub"
            :data-variant="variant"
            :data-button-text="buttonText || ''"
          >
            <button class="alert-stub__action" @click="$emit('click')">
              Trigger
            </button>
            <slot name="title" />
            <slot name="description" />
          </div>
        `,
      },
    },
  },
});

describe('DashboardPageHeader', () => {
  beforeEach(() => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: true,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.approved,
    };
    openContactUsDialog.mockClear();
    onKycClick.mockClear();
    onAccreditationClick.mockClear();
    onKycAlertDescriptionClick.mockClear();
    onAccreditationAlertDescriptionClick.mockClear();
    kycDataAlert.value = { title: '', description: '', buttonText: '' };
    accreditationDataAlert.value = { title: '', description: '', buttonText: '' };
  });

  it('shows performance cards when verification is complete', async () => {
    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.text()).toContain('Overview');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(true);
    expect(wrapper.find('.alert-stub').exists()).toBe(false);
  });

  it('shows a warning banner and triggers the KYC action when identity verification is pending', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.new,
    };

    const wrapper = mountHeader(DashboardTabTypes.portfolio);
    const alert = wrapper.find('.alert-stub');

    expect(alert.attributes('data-variant')).toBe('error');
    expect(alert.attributes('data-button-text')).toBe('Continue');
    expect(wrapper.text()).toContain('In order to invest you need to finish KYC');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);

    await alert.find('.alert-stub__action').trigger('click');
    expect(onKycClick).toHaveBeenCalledTimes(1);
    expect(onAccreditationClick).not.toHaveBeenCalled();
  });

  it('shows the account-details help CTA and opens contact us from the header copy', async () => {
    const wrapper = mountHeader(DashboardTabTypes.acount);

    await wrapper.find('button.is--link-2').trigger('click');
    expect(openContactUsDialog).toHaveBeenCalledWith('dashboard profile details');
  });

  it('shows the wallet total balance component on the wallet tab', () => {
    const wrapper = mountHeader(DashboardTabTypes.wallet);

    expect(wrapper.text()).toContain('Total Balance:');
    expect(wrapper.text()).toContain('$12,345');
    expect(wrapper.text()).toContain('.67');
    expect(wrapper.text()).not.toContain('Move funds, review balances, and track wallet activity across your profile.');
  });
});
