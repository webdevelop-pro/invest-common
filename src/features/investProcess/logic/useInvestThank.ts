import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { ROUTE_DASHBOARD_PORTFOLIO, ROUTE_INVESTMENT_TIMELINE } from 'InvestCommon/domain/config/enums/routes';
import { storeToRefs } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

export function useInvestThank() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);
  const route = useRoute();
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const loading = computed(() => getInvestOneState.value.loading);

  const data = computed(() => ([
    {
      title: 'Investment size:',
      text: getInvestOneState.value.data?.amountFormatted,
      isBold: true,
    },
    {
      title: 'Number of Shares:',
      text: getInvestOneState.value.data?.numberOfSharesFormatted,
    },
    {
      title: 'Price per Share:',
      text: getInvestOneState.value.data?.pricePerShareFormatted,
    },
    {
      title: 'Security Type:',
      text: getInvestOneState.value.data?.offer.securityTypeFormatted,
    },
  ]));

  const trackInvestmentTo = computed(() => (
    {
      name: ROUTE_INVESTMENT_TIMELINE,
      params: { profileId: selectedUserProfileId.value, id: getInvestOneState.value.data?.id },
    }
  ));

  onMounted(async () => {
    if (route.params.id) investmentRepository.getInvestOne(route.params.id.toString());
    else router.push({ name: ROUTE_DASHBOARD_PORTFOLIO, params: { profileId: selectedUserProfileId.value } });
  });

  return {
    loading,
    data,
    trackInvestmentTo,
    getInvestOneState,
    selectedUserProfileId,
    ROUTE_DASHBOARD_PORTFOLIO,
  };
} 