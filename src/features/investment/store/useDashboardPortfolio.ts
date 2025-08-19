import { ref, computed, watch } from 'vue';
import { defineStore, acceptHMRUpdate, storeToRefs } from 'pinia';
import { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useReactiveQuery } from 'UiKit/composables/useReactiveQuery';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.type';

// Status mapping from display names to actual values
const STATUS_MAPPING = {
  Confirmed: 'confirmed',
  'Legally Confirmed': 'legally_confirmed',
  'Cancelled After Investment': 'cancelled_after_investment',
  'Successfully Closed': 'successfully_closed',
} as const;

export const useDashboardPortfolioStore = defineStore('dashboard-portfolio', () => {
  const search = ref('');

  const query = useReactiveQuery();
  const queryId = computed(() => Number(query.value?.get('id')));
  const filterPortfolio = ref([
    {
      value: 'funding-type',
      title: 'By funding type:',
      options: ['Wire', 'Wallet', 'ACH'],
      model: [] as string[],
    },
    {
      value: 'status',
      title: 'By status:',
      options: [
        'Confirmed',
        'Legally Confirmed',
        'Cancelled After Investment',
        'Successfully Closed',
      ],
      model: [] as string[],
    },
  ] as IVFilter[]);

  // Store dependencies
  const investmentRepository = useRepositoryInvestment();
  const { getInvestmentsState } = storeToRefs(investmentRepository);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  // Getters
  const portfolioData = computed(() => getInvestmentsState.value.data?.data || []);
  const totalResults = computed(() => portfolioData.value.length);

  const isFiltering = computed(() => (
    filterPortfolio.value.some((item: IVFilter) => item.model?.length > 0) || search.value?.length > 0));

  const filteredData = computed(() => {
    let filtered = portfolioData.value;

    // Apply funding type filter
    const fundingTypeFilter = filterPortfolio.value.find((item: IVFilter) => item.value === 'funding-type');
    if (fundingTypeFilter?.model?.length) {
      const fundingTypes = fundingTypeFilter.model.map((type: string) => type.toLowerCase());
      filtered = filtered.filter((item: IInvestmentFormatted) => (
        fundingTypes.includes(item.funding_type?.toLowerCase())));
    }

    // Apply status filter
    const statusFilter = filterPortfolio.value.find((item: IVFilter) => item.value === 'status');
    if (statusFilter?.model?.length) {
      const statusValues = statusFilter.model.map((displayName: string) => (
        STATUS_MAPPING[displayName as keyof typeof STATUS_MAPPING]));
      filtered = filtered.filter((item: IInvestmentFormatted) => statusValues.includes(item.status));
    }

    // Apply search filter
    if (search.value) {
      const searchTerm = search.value.toLowerCase();
      filtered = filtered.filter((item: IInvestmentFormatted) => String(item.id).toLowerCase().includes(searchTerm)
        || item.offer.name.toLowerCase().includes(searchTerm));
    }

    return filtered;
  });

  const filterResults = computed(() => filteredData.value.length);


  const setSearch = (value: string) => {
    search.value = value;
  };

  const onApplyFilter = (items: IVFilter[]) => {
    filterPortfolio.value = items;
  };

  const resetFilters = () => {
    search.value = '';
    filterPortfolio.value = filterPortfolio.value.map((filter) => ({
      ...filter,
      model: [] as string[],
    }));
  };

  const resetAll = () => {
    portfolioData.value = [];
    search.value = '';
    filterPortfolio.value = filterPortfolio.value.map((filter: IVFilter) => ({
      ...filter,
      model: [] as string[],
    }));
  };

  // Watchers
  watch(() => selectedUserProfileId.value, () => {
    if (selectedUserProfileId.value && selectedUserProfileId.value > 0) {
      investmentRepository.getInvestments(selectedUserProfileId.value);
    }
  }, { immediate: true });

  return {
    // State
    portfolioData,
    search,
    filterPortfolio,
    queryId,
    getInvestmentsState,

    // Getters
    totalResults,
    isFiltering,
    filteredData,
    filterResults,

    // Actions
    setSearch,
    onApplyFilter,
    resetFilters,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardPortfolioStore, import.meta.hot));
}
