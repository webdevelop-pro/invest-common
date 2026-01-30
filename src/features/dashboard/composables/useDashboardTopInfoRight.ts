import { computed } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { currency } from 'InvestCommon/helpers/currency';
import { storeToRefs } from 'pinia';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

export interface DashboardTopInfoRightCard {
  id: number;
  title: string;
  currency: string;
  coin: string;
  change: number;
  changeClass: (string | { 'is--show': boolean })[];
  changeText?: string;
}

export function useDashboardTopInfoRight() {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(profilesStore);

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getUserState, getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);

  const isLoading = computed(() => (getUserState.value.loading || getProfileByIdState.value.loading));

  const totalInvested = computed(() => (selectedUserProfileData.value?.total_investments || 0));
  const totalInvestedMain = computed(() => Math.floor(totalInvested.value));
  const totalInvestedCoins = computed(() => {
    const coins = (totalInvested.value - totalInvestedMain.value).toFixed(2);
    return coins.toString().substring(1);
  });
  const totalInvestedChange = computed(() => (
    selectedUserProfileData.value?.total_investments_change_percent || 0));
  const totalInvestedClass = computed(() => {
    if (totalInvestedChange.value > 0) return 'is--positive';
    if (totalInvestedChange.value < 0) return 'is--negative';
    return '';
  });
  const totalDistributionsChange = computed(() => (
    selectedUserProfileData.value?.total_distributions_change_percent || 0));
  const totalDistributionsClass = computed(() => {
    if (totalDistributionsChange.value > 0) return 'is--positive';
    if (totalDistributionsChange.value < 0) return 'is--negative';
    return '';
  });
  const totalDistributions = computed(() => (selectedUserProfileData.value?.total_distributions || 0));
  const totalDistributionsMain = computed(() => Math.floor(totalDistributions.value));
  const totalDistributionsCoins = computed(() => {
    const coins = (totalDistributions.value - totalDistributionsMain.value).toFixed(2);
    return coins.toString().substring(1);
  });
  const showChange = computed(() => totalInvested.value > 0);

  const sliderData = computed((): DashboardTopInfoRightCard[] => {
    const formatChangeText = (change: number) => {
      const sign = change > 0 ? '+' : '';
      return `${sign}${change}% change in 30 days`;
    };

    return [
      {
        id: 1,
        title: 'Total Invested',
        currency: currency(totalInvestedMain.value, 0),
        coin: totalInvestedCoins.value,
        change: totalInvestedChange.value,
        changeClass: [totalInvestedClass.value, { 'is--show': showChange.value }],
        changeText: isLoading.value || !showChange.value
          ? undefined
          : formatChangeText(totalInvestedChange.value),
      },
      {
        id: 2,
        title: 'Total Distributions',
        currency: currency(totalDistributionsMain.value, 0),
        coin: totalDistributionsCoins.value,
        change: totalDistributionsChange.value,
        changeClass: [totalDistributionsClass.value, { 'is--show': showChange.value }],
        changeText: isLoading.value || !showChange.value
          ? undefined
          : formatChangeText(totalDistributionsChange.value),
      },
    ];
  });

  return {
    isLoading,
    sliderData,
    // Expose individual values if needed
    totalInvested,
    totalInvestedChange,
    totalDistributions,
    totalDistributionsChange,
  };
}
