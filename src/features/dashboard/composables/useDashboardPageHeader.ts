import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { InvestKycTypes, KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { ACCREDITATION_HISTORY, INVEST_KYC_HISTORY } from 'InvestCommon/features/investment/utils';

type DashboardHeaderBanner = {
  type: 'kyc' | 'accreditation';
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
  action?: 'kyc' | 'accreditation';
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
  const { selectedUserProfileData } = storeToRefs(profilesStore);
  const dialogsStore = useDialogs();

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

  const showPerformanceCards = computed(() => verificationBanner.value === null);

  const onInfoCtaClick = () => {
    dialogsStore.openContactUsDialog('dashboard profile details');
  };

  return {
    onInfoCtaClick,
    showPerformanceCards,
    verificationBanner,
  };
}
