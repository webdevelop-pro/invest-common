import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, nextTick, ref } from 'vue';
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
const selectedUserProfileId = ref(7);
const selectedUserProfileType = ref('individual');
const userSessionTraits = ref({ email: 'header@example.com' });
const isWalletAlertShow = ref(false);
const isWalletAlertLoading = ref(false);
const isWalletAlertType = ref<'error' | 'info'>('info');
const walletAlertText = ref('');
const walletAlertTitle = ref<string | undefined>(undefined);
const walletAlertButtonText = ref<string | undefined>(undefined);
const openWalletAuthDialog = vi.fn();
const maybeOpenAfterKyc = vi.fn();
const startFlowForProfile = vi.fn();
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
        return {
          selectedUserProfileData,
          selectedUserProfileId,
          selectedUserProfileType,
        };
      }
      if ('userSessionTraits' in store) {
        return { userSessionTraits };
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
    selectedUserProfileId,
    selectedUserProfileType,
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSessionTraits,
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

vi.mock('InvestCommon/features/wallet/logic/useWalletAlert', () => ({
  useWalletAlert: (options?: { hideBankAccountMissingInfo?: boolean }) => ({
    isAlertShow: computed(() => {
      const shouldHideBankAccountMissing =
        options?.hideBankAccountMissingInfo
        && isWalletAlertType.value === 'info'
        && walletAlertTitle.value === undefined
        && walletAlertText.value.includes('bank account');

      return shouldHideBankAccountMissing ? false : isWalletAlertShow.value;
    }),
    isAlertType: isWalletAlertType,
    isAlertText: walletAlertText,
    alertTitle: walletAlertTitle,
    alertButtonText: walletAlertButtonText,
    isDataLoading: isWalletAlertLoading,
  }),
}));

vi.mock('InvestCommon/features/wallet/store/useWalletAuth', () => ({
  useWalletAuth: () => ({
    openDialog: openWalletAuthDialog,
    maybeOpenAfterKyc,
    startFlowForProfile,
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
      VWalletButton: {
        template: '<div data-testid="wallet-auth-button">Wallet Auth</div>',
      },
      DashboardWalletAlert: {
        props: ['variant', 'alertText', 'alertTitle', 'buttonText'],
        emits: ['click', 'contactUsClick'],
        template: `
          <div
            class="wallet-alert-stub"
            :data-variant="variant"
            :data-button-text="buttonText || ''"
          >
            <button class="wallet-alert-stub__action" @click="$emit('click')">
              Wallet Trigger
            </button>
            <button class="wallet-alert-stub__contact" @click="$emit('contactUsClick', $event)">
              Contact
            </button>
            <div class="wallet-alert-stub__title">{{ alertTitle }}</div>
            <div class="wallet-alert-stub__description">{{ alertText }}</div>
          </div>
        `,
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
    openWalletAuthDialog.mockClear();
    maybeOpenAfterKyc.mockClear();
    startFlowForProfile.mockClear();
    maybeOpenAfterKyc.mockResolvedValue(undefined);
    kycDataAlert.value = { title: '', description: '', buttonText: '' };
    accreditationDataAlert.value = { title: '', description: '', buttonText: '' };
    isWalletAlertShow.value = false;
    isWalletAlertLoading.value = false;
    isWalletAlertType.value = 'info';
    walletAlertText.value = '';
    walletAlertTitle.value = undefined;
    walletAlertButtonText.value = undefined;
    isWalletDataLoading.value = false;
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

  it('shows a wallet banner when wallet alerts are active and verification is complete', async () => {
    isWalletAlertShow.value = true;
    isWalletAlertType.value = 'info';
    walletAlertTitle.value = 'Your wallet is being created and verified.';
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    const alert = wrapper.find('.wallet-alert-stub');
    expect(alert.exists()).toBe(true);
    expect(alert.attributes('data-variant')).toBe('info');
    expect(alert.text()).toContain('Your wallet is being created and verified.');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);

    await alert.find('.wallet-alert-stub__action').trigger('click');
    expect(openWalletAuthDialog).not.toHaveBeenCalled();
    expect(maybeOpenAfterKyc).not.toHaveBeenCalled();
    expect(startFlowForProfile).toHaveBeenCalledWith({
      profileId: 7,
      isKycApproved: true,
      profileType: 'individual',
      profileName: undefined,
      fullAccountName: undefined,
      userEmail: 'header@example.com',
      walletStatus: undefined,
    });
  });

  it('keeps KYC banner priority over wallet alerts', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: true,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.approved,
    };
    isWalletAlertShow.value = true;
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(true);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(false);
  });

  it('shows wallet and accreditation alerts together', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.pending,
    };
    isWalletAlertShow.value = true;
    isWalletAlertType.value = 'info';
    walletAlertTitle.value = 'Your wallet is being created and verified.';
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(true);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(true);
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);
  });

  it('keeps bank-account wallet alerts out of the wallet-auth banner', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: true,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.approved,
      wallet: {
        status: 'verified',
      },
    };
    isWalletAlertShow.value = true;
    isWalletAlertType.value = 'info';
    walletAlertText.value = 'You need to connect a bank account before you can add funds.';
    walletAlertTitle.value = undefined;

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(false);
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(true);
  });

  it('always shows the wallet skeleton while wallet alerts are loading', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.pending,
    };
    isWalletAlertShow.value = true;
    isWalletDataLoading.value = true;
    walletAlertTitle.value = 'Wallet update';
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(true);
    expect(wrapper.find('[data-testid="wallet-alert-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(false);
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);
  });

  it('does not show the wallet skeleton when wallet data is idle on a non-KYC-approved profile', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.pending,
    };
    isWalletDataLoading.value = true;

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('[data-testid="wallet-alert-skeleton"]').exists()).toBe(false);
    expect(wrapper.find('.alert-stub').exists()).toBe(true);
  });

  it('opens contact us from the wallet banner contact link handler', async () => {
    isWalletAlertShow.value = true;
    walletAlertTitle.value = 'Wallet update';
    walletAlertText.value = 'Please contact us.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    const alert = wrapper.find('.wallet-alert-stub');

    await alert.find('.wallet-alert-stub__contact').trigger('click');
    expect(openContactUsDialog).toHaveBeenCalledWith('wallet');
  });
});
