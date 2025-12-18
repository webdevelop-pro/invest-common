import { computed, ref } from 'vue';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/domain/config/enums/routes';
import { storeToRefs } from 'pinia';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

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
  const isDialogCancelOpen = ref(false);
  const dialogsStore = useDialogs();

  // Use the repository state instead of store
  const getInvestOneData = computed(() => getInvestOneState.value.data);

  const userName = computed(() => `${props.profileData?.data?.first_name} ${props.profileData?.data?.last_name}`);
  const profileType = computed(() => props.profileData?.type || '');
  const targetRaiseText = computed(() => (getInvestOneData.value?.offer?.isSecurityTypeDebt || getInvestOneData.value?.offer?.isSecurityTypeConvertibleDebt || getInvestOneData.value?.offer?.isSecurityTypeConvertibleNote) ? 'Funding Goal:' : 'Target Raise:');

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
      text: targetRaiseText.value,
      value: getInvestOneData.value?.offer?.targetRaiseFormatted,
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
    dialogsStore.openContactUsDialog('investment');
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
    isDialogCancelOpen,
    
    // Actions
    onBackClick,
    onCancelInvestmentClick,
    onFundingType,
    onContactUsClick,
  };
} 