import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, nextTick, ref } from 'vue';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { InvestKycTypes, type KycAlertModel } from 'InvestCommon/data/kyc/kyc.types';
import { DashboardTabTypes } from '../../utils';
import DashboardPageHeader from '../DashboardPageHeader.vue';

const selectedUserProfileData = ref<any>(null);
const selectedUserProfileId = ref(7);
const selectedUserProfileType = ref('individual');
const isSelectedProfileLoading = ref(false);
const userSessionTraits = ref({ email: 'header@example.com' });
const openContactUsDialog = vi.fn();
const onKycBannerClick = vi.fn();
const onKycBannerDescriptionAction = vi.fn();
const onAccreditationClick = vi.fn();
const onAccreditationAlertDescriptionClick = vi.fn();
const totalBalanceMainFormatted = ref('$12,345');
const totalBalanceCoins = ref('.67');
const isWalletDataLoading = ref(false);
const isWalletAlertShow = ref(false);
const isWalletAlertType = ref<'error' | 'info'>('info');
const walletAlertText = ref('');
const walletAlertTitle = ref<string | undefined>(undefined);
const walletAlertButtonText = ref<string | undefined>(undefined);
const walletAlertIsLoading = ref(false);
const walletAlertIsDisabled = ref(false);
const onWalletBannerClick = vi.fn();
const onWalletBannerDescriptionAction = vi.fn();
const isKycDataLoading = ref(false);
const kycAlertModel = ref<KycAlertModel>({
  show: false,
  variant: 'error',
  title: '',
  description: '',
  buttonText: undefined,
  isLoading: false,
  isDisabled: false,
});
const accreditationDataAlert = ref({
  title: '',
  description: '',
  buttonText: '',
});
const isAccreditationLoading = ref(false);

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
          isSelectedProfileLoading,
        };
      }

      if ('userSessionTraits' in store) {
        return { userSessionTraits };
      }

      if ('dataAlert' in store) {
        return {
          dataAlert: accreditationDataAlert,
          isLoading: isAccreditationLoading,
        };
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
    isSelectedProfileLoading,
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

vi.mock('InvestCommon/features/kyc/logic/useKycAlertViewModel', () => ({
  useKycAlertViewModel: () => ({
    alertModel: kycAlertModel,
    isDataLoading: isKycDataLoading,
    onPrimaryAction: onKycBannerClick,
    onDescriptionAction: onKycBannerDescriptionAction,
  }),
}));

vi.mock('InvestCommon/features/accreditation/store/useAccreditationStatus', () => ({
  useAccreditationStatus: () => ({
    dataAlert: accreditationDataAlert,
    isLoading: isAccreditationLoading,
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
  useWalletAlert: () => ({
    alertModel: computed(() => ({
      show: isWalletAlertShow.value,
      variant: isWalletAlertType.value,
      title: walletAlertTitle.value,
      description: walletAlertText.value,
      buttonText: walletAlertButtonText.value,
      isLoading: walletAlertIsLoading.value,
      isDisabled: walletAlertIsDisabled.value,
    })),
    isDataLoading: computed(() => isWalletDataLoading.value),
    onAlertButtonClick: onWalletBannerClick,
    onDescriptionAction: onWalletBannerDescriptionAction,
  }),
}));

vi.mock('UiKit/composables/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isDesktop: computed(() => true),
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
      DashboardWalletAlert: {
        props: ['variant', 'description', 'title', 'buttonText', 'isLoading', 'isDisabled'],
        emits: ['action', 'descriptionAction'],
        template: `
          <div
            class="wallet-alert-stub"
            :data-variant="variant"
            :data-button-text="buttonText || ''"
          >
            <button class="wallet-alert-stub__action" @click="$emit('action')">
              Wallet Trigger
            </button>
            <button class="wallet-alert-stub__contact" @click="$emit('descriptionAction', $event)">
              Contact
            </button>
            <div class="wallet-alert-stub__title">{{ title }}</div>
            <div class="wallet-alert-stub__description">{{ description }}</div>
          </div>
        `,
      },
      VAlert: {
        props: ['variant'],
        template: `
          <div class="alert-stub" :data-variant="variant">
            <div class="alert-stub__title"><slot name="title" /></div>
            <div class="alert-stub__description"><slot name="description" /></div>
            <div class="alert-stub__actions"><slot /></div>
          </div>
        `,
      },
      VButton: {
        props: ['loading', 'disabled'],
        emits: ['click'],
        template: `
          <button
            class="alert-stub__action"
            :data-loading="String(loading)"
            :disabled="disabled"
            @click="$emit('click')"
          >
            <slot />
          </button>
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
    kycAlertModel.value = {
      show: false,
      variant: 'error',
      title: '',
      description: '',
      buttonText: undefined,
      isLoading: false,
      isDisabled: false,
    };
    accreditationDataAlert.value = { title: '', description: '', buttonText: '' };
    isSelectedProfileLoading.value = false;
    isKycDataLoading.value = false;
    isAccreditationLoading.value = false;
    openContactUsDialog.mockClear();
    onKycBannerClick.mockClear();
    onKycBannerDescriptionAction.mockClear();
    onAccreditationClick.mockClear();
    onAccreditationAlertDescriptionClick.mockClear();
    onWalletBannerClick.mockClear();
    onWalletBannerDescriptionAction.mockClear();
    isWalletAlertShow.value = false;
    isWalletAlertType.value = 'info';
    walletAlertText.value = '';
    walletAlertTitle.value = undefined;
    walletAlertButtonText.value = undefined;
    walletAlertIsLoading.value = false;
    walletAlertIsDisabled.value = false;
    isWalletDataLoading.value = false;
  });

  it('shows performance cards when verification is complete', async () => {
    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.text()).toContain('Overview');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(true);
    expect(wrapper.find('.alert-stub').exists()).toBe(false);
  });

  it('renders the centralized KYC alert model and triggers its action', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.new,
    };
    kycAlertModel.value = {
      show: true,
      variant: 'error',
      title: 'Finish Your KYC',
      description: 'Complete the remaining identity verification steps.',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
    };

    const wrapper = mountHeader(DashboardTabTypes.portfolio);
    await nextTick();

    const alert = wrapper.find('.alert-stub');
    expect(alert.attributes('data-variant')).toBe('error');
    expect(alert.text()).toContain('Finish Your KYC');
    expect(alert.text()).toContain('Complete the remaining identity verification steps.');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);

    await wrapper.find('.alert-stub__action').trigger('click');
    expect(onKycBannerClick).toHaveBeenCalledTimes(1);
    expect(onAccreditationClick).not.toHaveBeenCalled();
  });

  it('passes KYC alert loading state to the alert CTA', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.new,
    };
    isKycDataLoading.value = true;
    kycAlertModel.value = {
      show: true,
      variant: 'error',
      title: 'Finish Your KYC',
      description: 'Complete the remaining identity verification steps.',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: true,
    };

    const wrapper = mountHeader();
    await nextTick();

    expect(wrapper.find('.alert-stub__action').attributes('data-loading')).toBe('true');
    expect(wrapper.find('.alert-stub__action').attributes()).toHaveProperty('disabled');
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

    await alert.find('.wallet-alert-stub__action').trigger('click');
    expect(onWalletBannerClick).toHaveBeenCalledTimes(1);
  });

  it('shows the accreditation banner after KYC approval when wallet setup is clear', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.pending,
    };

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    const alert = wrapper.find('.alert-stub');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Verification In Progress');
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(false);
  });

  it('shows the wallet banner alongside the KYC banner when both are active', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: true,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.approved,
    };
    kycAlertModel.value = {
      show: true,
      variant: 'error',
      title: 'Finish Your KYC',
      description: 'Complete the remaining identity verification steps.',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
    };
    isWalletAlertShow.value = true;
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(true);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(true);
  });

  it('prioritizes the wallet banner over accreditation after KYC approval', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.pending,
    };
    accreditationDataAlert.value = {
      title: 'Accreditation pending',
      description: 'We are reviewing your accreditation documents.',
      buttonText: '',
    };
    isWalletAlertShow.value = true;
    isWalletAlertType.value = 'info';
    walletAlertTitle.value = 'Your wallet is being created and verified.';
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(false);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(true);
  });

  it('shows bank-account wallet alerts in the dashboard header', async () => {
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

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(true);
    expect(wrapper.find('.wallet-alert-stub__description').text()).toContain('bank account');
    expect(wrapper.find('[data-testid="performance-cards"]').exists()).toBe(false);
  });

  it('keeps showing the wallet banner while wallet data is refreshing', async () => {
    selectedUserProfileData.value = {
      isKycApproved: true,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.approved,
      accreditation_status: AccreditationTypes.pending,
    };
    accreditationDataAlert.value = {
      title: 'Accreditation pending',
      description: 'We are reviewing your accreditation documents.',
      buttonText: '',
    };
    isWalletAlertShow.value = true;
    isWalletDataLoading.value = true;
    walletAlertTitle.value = 'Wallet update';
    walletAlertText.value = 'This usually takes a few moments.';

    const wrapper = mountHeader(DashboardTabTypes.summary);
    await nextTick();

    expect(wrapper.find('.alert-stub').exists()).toBe(false);
    expect(wrapper.find('[data-testid="wallet-alert-skeleton"]').exists()).toBe(false);
    expect(wrapper.find('.wallet-alert-stub').exists()).toBe(true);
  });

  it('does not show the wallet skeleton when wallet data is idle on a non-KYC-approved profile', async () => {
    selectedUserProfileData.value = {
      isKycApproved: false,
      isAccreditationApproved: false,
      kyc_status: InvestKycTypes.pending,
      accreditation_status: AccreditationTypes.pending,
    };
    kycAlertModel.value = {
      show: true,
      variant: 'error',
      title: 'Finish Your KYC',
      description: 'Complete the remaining identity verification steps.',
      buttonText: 'Continue',
      isLoading: false,
      isDisabled: false,
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
    expect(onWalletBannerDescriptionAction).toHaveBeenCalledTimes(1);
  });
});
