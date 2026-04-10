import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { ACCREDITATION_HISTORY } from 'InvestCommon/features/investment/utils';
import { useKycAlertViewModel } from 'InvestCommon/features/kyc/logic/useKycAlertViewModel';
import { useWalletAlert } from 'InvestCommon/features/wallet/logic/useWalletAlert';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

type DashboardHeaderBanner = {
  type: 'kyc' | 'accreditation' | 'wallet';
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
};

const getAccreditationBanner = (status: AccreditationTypes): DashboardHeaderBanner => {
  const history = ACCREDITATION_HISTORY[status];

  if (status === AccreditationTypes.pending) {
    return {
      type: 'accreditation',
      variant: 'info',
      title: history.title,
      description: history.text,
    };
  }

  if (status === AccreditationTypes.declined) {
    return {
      type: 'accreditation',
      variant: 'error',
      title: history.title,
      description: history.text,
      buttonText: 'Verify Accreditation',
    };
  }

  return {
    type: 'accreditation',
    variant: 'error',
    title: history.title,
    description: history.text,
    buttonText: status === AccreditationTypes.expired
      ? 'Verify Accreditation'
      : history.buttonText,
  };
};

export function useDashboardPageHeader() {
  const profilesStore = useProfilesStore();
  const {
    selectedUserProfileData,
  } = storeToRefs(profilesStore);
  const dialogsStore = useDialogs();
  const { isDesktop } = useBreakpoints();
  const {
    alertModel: kycAlertModel,
    onPrimaryAction: onKycBannerClick,
    onDescriptionAction: onKycBannerDescriptionAction,
  } = useKycAlertViewModel();
  const {
    alertModel: walletAlertModel,
    isDataLoading: isWalletAlertDataLoading,
    onAlertButtonClick: onWalletBannerClick,
    onDescriptionAction: onWalletBannerDescriptionAction,
  } = useWalletAlert({
    hideBankAccountMissingInfo: true,
  });

  const isWalletAlertLoading = computed(() => (
    Boolean(selectedUserProfileData.value?.isKycApproved) && isWalletAlertDataLoading.value
  ));

  const verificationBanner = computed<DashboardHeaderBanner | null>(() => {
    const selectedProfile = selectedUserProfileData.value;
    if (!selectedProfile) {
      return null;
    }

    if (kycAlertModel.value.show) {
      return {
        type: 'kyc',
        variant: kycAlertModel.value.variant,
        title: kycAlertModel.value.title,
        description: kycAlertModel.value.description,
        buttonText: kycAlertModel.value.buttonText,
        isLoading: kycAlertModel.value.isLoading,
        isDisabled: kycAlertModel.value.isDisabled,
      };
    }

    const accreditationStatus = selectedProfile.accreditation_status;
    if (accreditationStatus && !selectedProfile.isAccreditationApproved) {
      return getAccreditationBanner(accreditationStatus);
    }

    return null;
  });

  const walletBanner = computed<DashboardHeaderBanner | null>(() => {
    const selectedProfile = selectedUserProfileData.value;
    if (!selectedProfile?.isKycApproved) {
      return null;
    }

    if (verificationBanner.value?.type === 'kyc') {
      return null;
    }

    if (!walletAlertModel.value.show || !walletAlertModel.value.description) {
      return null;
    }

    return {
      type: 'wallet',
      variant: walletAlertModel.value.variant,
      title: walletAlertModel.value.title || 'Wallet update',
      description: walletAlertModel.value.description,
      buttonText: walletAlertModel.value.buttonText,
      isLoading: walletAlertModel.value.isLoading,
      isDisabled: walletAlertModel.value.isDisabled,
    };
  });

  const showPerformanceCards = computed(() => (
    verificationBanner.value === null && walletBanner.value === null && isDesktop.value
  ));

  const onInfoCtaClick = () => {
    dialogsStore.openContactUsDialog('dashboard profile details');
  };

  return {
    onInfoCtaClick,
    onKycBannerClick,
    onKycBannerDescriptionAction,
    onWalletBannerClick,
    onWalletBannerDescriptionAction,
    showPerformanceCards,
    verificationBanner,
    walletBanner,
    isWalletAlertLoading,
  };
}
