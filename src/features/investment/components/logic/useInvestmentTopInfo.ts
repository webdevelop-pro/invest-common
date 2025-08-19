import { computed, ref } from 'vue';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';

export interface UseInvestmentTopInfoProps {
  investmentId: string;
  profileData?: any;
}

export function useInvestmentTopInfo(props: UseInvestmentTopInfoProps) {
  const router = useRouter();
  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);

  const isDialogTransactionOpen = ref(false);
  const isDialogWireOpen = ref(false);
  const isDialogContactUsOpen = ref(false);
  const isDialogCancelOpen = ref(false);

  // Use the repository state instead of store
  const getInvestOneData = computed(() => getInvestOneState.value.data);

  const userName = computed(() => `${props.profileData?.data?.first_name} ${props.profileData?.data?.last_name}`);
  const profileType = computed(() => props.profileData?.type || '');

  const infoData = computed(() => ([
    {
      text: 'Ownership:',
      value: profileType.value.charAt(0).toUpperCase() + profileType.value.slice(1),
    },
    {
      text: 'Funding Type:',
      value: getInvestOneData.value?.fundingTypeFormatted,
      funding: getInvestOneData.value?.isFundingClickable,
    },
    {
      text: 'Created Date:',
      value: getInvestOneData.value?.createdAtFormatted,
    },
    {
      text: 'Security Type:',
      value: getInvestOneData.value?.offer?.securityTypeFormatted,
    },
    {
      text: 'Valuation:',
      value: getInvestOneData.value?.offer?.valuationFormatted,
    },
    {
      text: 'Close Date:',
      value: getInvestOneData.value?.offer?.closeAtFormatted,
      tooltip: 'Closing offer date may vary depending on factors such as property type, financing conditions, buyer readiness, or legal requirements.',
    },
  ]));

  const onBackClick = () => {
    void router.push({
      name: ROUTE_DASHBOARD_PORTFOLIO,
      params: { profileId: props.profileData?.id },
      query: { id: props.investmentId },
    });
  };

  const onCancelInvestmentClick = () => {
    isDialogCancelOpen.value = true;
  };

  const onFundingType = () => {
    if (!getInvestOneData.value?.isFundingClickable) return;
    if (getInvestOneData.value?.isFundingTypeWire) {
      isDialogWireOpen.value = true;
    } else isDialogTransactionOpen.value = true;
  };

  const onContactUsClick = () => {
    isDialogContactUsOpen.value = true;
  };

  return {
    // State
    getInvestOneState,
    getInvestOneData,
    userName,
    profileType,
    infoData,
    isDialogTransactionOpen,
    isDialogWireOpen,
    isDialogContactUsOpen,
    isDialogCancelOpen,
    
    // Actions
    onBackClick,
    onCancelInvestmentClick,
    onFundingType,
    onContactUsClick,
  };
} 