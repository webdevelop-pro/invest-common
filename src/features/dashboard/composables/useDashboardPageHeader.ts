import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { InvestKycTypes, KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { ACCREDITATION_HISTORY, INVEST_KYC_HISTORY } from 'InvestCommon/features/investment/utils';
import { useWallet } from 'InvestCommon/features/wallet/logic/useWallet';
import { useWalletAlert } from 'InvestCommon/features/wallet/logic/useWalletAlert';
import { useWalletAuth } from 'InvestCommon/features/wallet/store/useWalletAuth';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

type DashboardHeaderBanner = {
  type: 'kyc' | 'accreditation' | 'wallet';
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
  action?: 'kyc' | 'accreditation' | 'wallet';
};

const getKycBanner = (status: InvestKycTypes): DashboardHeaderBanner => {
  const history = INVEST_KYC_HISTORY[status];

  if (status === InvestKycTypes.declined) {
    return {
      type: 'kyc',
      variant: 'error',
      title: history.title,
      description: history.text,
    };
  }

  if (status === InvestKycTypes.in_progress) {
    return {
      type: 'kyc',
      variant: 'info',
      title: history.title,
      description: history.text,
    };
  }

  return {
    type: 'kyc',
    variant: 'error',
    title: history.title,
    description: history.text,
    buttonText: KycTextStatuses[status].text,
    action: 'kyc',
  };
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
      action: 'accreditation',
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
    action: 'accreditation',
  };
};

export function useDashboardPageHeader() {
  const profilesStore = useProfilesStore();
  const sessionStore = useSessionStore();
  const {
    selectedUserProfileData,
    selectedUserProfileId,
    selectedUserProfileType,
  } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);
  const dialogsStore = useDialogs();
  const walletAuthStore = useWalletAuth();
  const { isDesktop } = useBreakpoints();
  const { isWalletDataLoading } = useWallet();
  const {
    isAlertShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
  } = useWalletAlert({
    hideBankAccountMissingInfo: true,
  });

  const isWalletAlertLoading = computed(() => (
    Boolean(selectedUserProfileData.value?.isKycApproved) && isWalletDataLoading.value
  ));

  const verificationBanner = computed<DashboardHeaderBanner | null>(() => {
    const selectedProfile = selectedUserProfileData.value;
    if (!selectedProfile) {
      return null;
    }

    const kycStatus = selectedProfile.kyc_status;
    if (kycStatus && !selectedProfile.isKycApproved) {
      return getKycBanner(kycStatus);
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

    if (!isAlertShow.value || !isAlertText.value) {
      return null;
    }

    return {
      type: 'wallet',
      variant: isAlertType.value as 'error' | 'info',
      title: alertTitle.value || 'Wallet update',
      description: isAlertText.value,
      buttonText: alertButtonText.value,
      action: 'wallet',
    };
  });

  const showPerformanceCards = computed(() => (
    verificationBanner.value === null && walletBanner.value === null && isDesktop.value
  ));

  const onInfoCtaClick = () => {
    dialogsStore.openContactUsDialog('dashboard profile details');
  };

  const onWalletBannerClick = () => {
    const profileId = Number(selectedUserProfileId.value);
    if (!profileId) {
      return;
    }

    void walletAuthStore.startFlowForProfile({
      profileId,
      isKycApproved: selectedUserProfileData.value?.isKycApproved,
      profileType: selectedUserProfileType.value,
      profileName: selectedUserProfileData.value?.name,
      fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
      userEmail: userSessionTraits.value?.email,
      walletStatus: selectedUserProfileData.value?.wallet?.status,
    });
  };

  const onWalletBannerContactUsClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    dialogsStore.openContactUsDialog('wallet');
  };

  return {
    onInfoCtaClick,
    onWalletBannerClick,
    onWalletBannerContactUsClick,
    showPerformanceCards,
    verificationBanner,
    walletBanner,
    isWalletAlertLoading,
  };
}
