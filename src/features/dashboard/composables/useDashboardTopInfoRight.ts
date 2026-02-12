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
  /** Secondary line label (e.g. "change in 30 days"). */
  secondaryText?: string;
  /** Secondary line value (e.g. "+5%" or "-2%"). */
  secondaryValue?: string;
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
  const totalDistributionsChange = computed(() => (
    selectedUserProfileData.value?.total_distributions_change_percent || 0));
  const totalDistributions = computed(() => (selectedUserProfileData.value?.total_distributions || 0));
  const totalDistributionsMain = computed(() => Math.floor(totalDistributions.value));
  const totalDistributionsCoins = computed(() => {
    const coins = (totalDistributions.value - totalDistributionsMain.value).toFixed(2);
    return coins.toString().substring(1);
  });
  const showChange = computed(() => totalInvested.value > 0);

  const sliderData = computed((): DashboardTopInfoRightCard[] => {
    const formatChangeValue = (change: number) => {
      const sign = change > 0 ? '+' : '';
      return `${sign}${change}%`;
    };
    const secondaryText = 'change in 30 days';

    return [
      {
        id: 1,
        title: 'Total Invested',
        currency: currency(totalInvestedMain.value, 0),
        coin: totalInvestedCoins.value,
        change: totalInvestedChange.value,
        secondaryText: showChange.value && !isLoading.value ? secondaryText : undefined,
        secondaryValue: showChange.value && !isLoading.value ? formatChangeValue(totalInvestedChange.value) : undefined,
      },
      {
        id: 2,
        title: 'Total Distributions',
        currency: currency(totalDistributionsMain.value, 0),
        coin: totalDistributionsCoins.value,
        change: totalDistributionsChange.value,
        secondaryText: showChange.value && !isLoading.value ? secondaryText : undefined,
        secondaryValue: showChange.value && !isLoading.value
          ? formatChangeValue(totalDistributionsChange.value)
          : undefined,
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
