import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import {
  IAccreditationData, IKycData, InvestKycTypes,
} from 'InvestCommon/types/api/invest';
import { ACCREDITATION_HISTORY, INVEST_KYC_HISTORY, ITimelineItemsHistory } from '../../utils';
import { PostLinkTypes } from 'InvestCommon/types/api/blog';
import { urlBlogSingle } from 'InvestCommon/domain/config/links';

export const useInvestmentTimeline = () => {
  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
  const useRepositoryKycStore = useRepositoryKyc();
  const { tokenState } = storeToRefs(useRepositoryKycStore);

  // Simplified date difference calculation
  const getDateDifference = (created: string, completed: string) => {
    const diff = Math.abs(new Date(created).getTime() - new Date(completed).getTime());
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return `${days} day${days === 1 ? '' : 's'}.`;
  };

  const getLegalCircleType = computed(() => {
    if (getInvestOneState.value.data?.offer.isFundingCompleted
      && !getInvestOneState.value.data?.offer.isStatusClosedSuccessfully) {
      return 'highlight';
    }
    if (getInvestOneState.value.data?.offer.isFundingCompleted
      && getInvestOneState.value.data?.offer.isStatusClosedSuccessfully) {
      return 'complete';
    }
    return 'not-complete';
  });

  const getLegalCardType = computed(() => {
    if (getInvestOneState.value.data?.offer.isFundingCompleted
      && !getInvestOneState.value.data?.offer.isStatusClosedSuccessfully) {
      return 'active';
    }
    if (getInvestOneState.value.data?.offer.isFundingCompleted
      && getInvestOneState.value.data?.offer.isStatusClosedSuccessfully) {
      return 'complete';
    }
    return 'not-complete';
  });

  // Accreditation data processing
  const accreditationParsedData = computed(() => {
    const { accreditation_data, accreditation_status } = selectedUserProfileData.value || {};
    if (!accreditation_data || !accreditation_status) return null;
    return accreditation_data.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return +new Date(a.created_at) - +new Date(b.created_at);
    });
  });

  const getAccreditationDuration = (item: IAccreditationData, index: number) => {
    if (!accreditationParsedData.value) return;
    const next = accreditationParsedData.value[index + 1];
    return next ? getDateDifference(item.created_at, next.created_at) : ACCREDITATION_HISTORY[item.status].duration;
  };

  const ApprovedAccreditationText = computed(() => `The accreditation status of your ${selectedUserProfileData.value?.type} investment profile has been successfully approved.`);

  const accreditationParsedHistory = computed(() => {
    const {
      accreditation_status,
      isAccreditationApproved,
      isAccreditationPending
    } = selectedUserProfileData.value || {};
    const data = accreditationParsedData.value;

    if (!data?.length) {
      return [{
        ...ACCREDITATION_HISTORY[accreditation_status || 'new'],
        variant: 'primary',
        type: isAccreditationApproved ? 'complete' : 'active',
        showButton: !isAccreditationApproved,
      }];
    }

    if (isAccreditationApproved) {
      return [{
        ...ACCREDITATION_HISTORY[accreditation_status || 'new'],
        text: ApprovedAccreditationText.value,
        duration: null,
        variant: 'primary',
        type: 'complete',
        showButton: false,
      }];
    }

    return data.map((item: IAccreditationData, index: number) => ({
      ...ACCREDITATION_HISTORY[item.status],
      duration: getAccreditationDuration(item, index),
      text: item.status === 'approved' ? ApprovedAccreditationText.value : ACCREDITATION_HISTORY[item.status].text,
      variant: data.length > 1 ? 'inner' : 'primary',
      type: isAccreditationApproved ? 'complete' : 'active',
      showButton: !isAccreditationApproved && !isAccreditationPending && ['declined', 'pending'].includes(item.status),
    }));
  });

  // KYC data processing
  const kycParsedData = computed(() => {
    const { kyc_data, kyc_status } = selectedUserProfileData.value || {};
    return kyc_data && kyc_status ? kyc_data : null;
  });

  const getKYCDuration = (item: IKycData, index: number) => {
    if (!kycParsedData.value) return;
    const next = kycParsedData.value[index - 1];
    return next ? getDateDifference(item.created_at, next.created_at) : INVEST_KYC_HISTORY[item.status].duration;
  };

  const kycParsedHistory = computed(() => {
    const {
      kyc_status, isKycApproved, isCanCallKycPlaid, isKycDeclined,
    } = selectedUserProfileData.value || {};
    const data = kycParsedData.value;

    if (!data?.length) {
      return [{
        ...INVEST_KYC_HISTORY[kyc_status || 'new'],
        variant: 'primary',
        type: isKycApproved ? 'complete' : 'active',
        showButton: isCanCallKycPlaid,
      }];
    }

    if (isKycApproved) {
      return [{
        ...INVEST_KYC_HISTORY[kyc_status || 'new'],
        duration: null,
        variant: 'primary',
        type: 'complete',
        showButton: isCanCallKycPlaid,
      }];
    }

    return data.map((item, index: number) => ({
      ...INVEST_KYC_HISTORY[item.status],
      duration: getKYCDuration(item, index),
      variant: data.length > 1 ? 'inner' : 'primary',
      type: isKycApproved ? 'complete' : 'active',
      showButton: !isKycApproved && item.status === InvestKycTypes.declined && isKycDeclined,
    }));
  });

  // Main timeline data
  const data = computed(() => ([
    {
      circleType: selectedUserProfileData.value?.isKycApproved ? 'complete' : 'highlight',
      items: kycParsedHistory.value,
      onButtonClick() {
        if (selectedUserProfileData.value?.isCanCallKycPlaid) {
          useRepositoryKycStore.handlePlaidKyc();
        }
      },
    },
    {
      circleType: selectedUserProfileData.value?.isAccreditationApproved ? 'complete' : 'highlight',
      items: accreditationParsedHistory.value,
      onButtonClick() { },
    },
    {
      circleType: getInvestOneState.value.data?.offer.isFundingCompleted ? 'complete' : 'active',
      title: `${getInvestOneState.value.data?.offer.offerFundedPercent}% FUNDED`,
      items: [
        {
          title: 'The offer closes fundraising campaign',
          duration: '~1 week',
          text: 'Once 100% funded, investors are no longer able to cancel their investments. Learn more info '
            + `<a href="${urlBlogSingle(PostLinkTypes.cancelInvestment)}" class="is--link-1">here</a> about the process.`,
          type: getInvestOneState.value.data?.offer.isFundingCompleted ? 'complete' : 'active',
        },
      ] as unknown as ITimelineItemsHistory[],
      onButtonClick() { },
    },
    {
      circleType: getLegalCircleType.value,
      items: [
        {
          title: 'Final legal checks',
          duration: '~2 weeks',
          text: 'Our system makes final legal checks and we seal the deal and send information to the '
            + `government structures. Learn more info <a href="${urlBlogSingle(PostLinkTypes.cancelInvestment)}" class="is--link-1">here</a> about the process.`,
          type: getLegalCardType.value,
        },
      ] as unknown as ITimelineItemsHistory[],
      onButtonClick() { },
    },
    {
      circleType: getInvestOneState.value.data?.offer.isStatusClosedSuccessfully ? 'active' : 'not-complete',
      items: [
        {
          title: 'Collect distributions and manage taxes',
          duration: '6 months',
          text: 'Don\'t forget to check your emails or web notifications in order not to miss '
            + `important tax and distribution updates. Learn more info <a href="${urlBlogSingle(PostLinkTypes.cancelInvestment)}" class="is--link-1 is--gray-10">here</a> `
            + 'about the process.',
          variant: 'highlight',
          type: getInvestOneState.value.data?.offer.isStatusClosedSuccessfully ? 'active' : 'not-complete',
        },
      ] as unknown as ITimelineItemsHistory[],
      onButtonClick() { },
    },
  ]));

  const getButtonTag = (item: ITimelineItemsHistory) => {
    if (item.buttonRoute) return 'router-link';
    if (item.buttonHref) return 'a';
    return 'button';
  };

  return {
    data,
    getButtonTag,
    selectedUserProfileId,
    tokenState,
  };
}; 