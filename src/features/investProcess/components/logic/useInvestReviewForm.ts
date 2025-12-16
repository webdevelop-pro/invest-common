import { computed } from 'vue';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';

export interface UseInvestReviewFormProps {
  data?: any;
  selectedUserProfileData?: any;
}

export function useInvestReviewForm(
  props: UseInvestReviewFormProps,
) {
  // Computed properties
  const investorName = computed(() => {
    const { first_name, middle_name, last_name } = props.selectedUserProfileData?.data || {};
    return [first_name, middle_name, last_name].filter(Boolean).join(' ');
  });

  const isSsnHidden = computed(() => props.selectedUserProfileData?.data?.is_full_ssn_provided === true);

  const fundingSourceDataToShow = computed(() => {
    const fundingType = props.data?.funding_type;
    if (!fundingType) return '';
    
    if (fundingType.toLowerCase() === FundingTypes.cryptoWallet) {
      return 'Crypto Wallet';
    }
    
    if (fundingType.toLowerCase().includes('wallet')) {
      return fundingType.charAt(0).toUpperCase() + fundingType.slice(1);
    }
    return fundingType.toUpperCase();
  });

  const isAchFunding = computed(() =>
    props.data?.funding_type?.toLowerCase() === 'ach'
  );

  return {
    // Computed values
    investorName,
    isSsnHidden,
    fundingSourceDataToShow,
    isAchFunding,
  };
}
