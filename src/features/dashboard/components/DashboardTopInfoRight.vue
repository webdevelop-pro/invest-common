<script setup lang="ts">
import { computed } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { currency } from 'InvestCommon/helpers/currency';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { storeToRefs } from 'pinia';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

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

const data = computed(() => ([
  {
    title: 'Total Invested',
    currency: currency(totalInvestedMain.value, 0),
    coin: totalInvestedCoins,
    change: totalInvestedChange.value,
    changeClass: [totalInvestedClass.value, { 'is--show': showChange.value }],
  },
  {
    title: 'Total Distributions',
    currency: currency(totalDistributionsMain.value, 0),
    coin: totalDistributionsCoins,
    change: totalDistributionsChange.value,
    changeClass: [totalDistributionsClass.value, { 'is--show': showChange.value }],
  },
]));
</script>

<template>
  <div class="DashboardTopInfoRight dashboard-top-info-right">
    <div
      v-for="item in data"
      :key="item.currency"
      class="dashboard-top-info-right__item is--card"
    >
      <div class="dashboard-top-info-right__item-label is--h6__title">
        {{ item.title }}
      </div>
      <VSkeleton
        v-if="isLoading"
        height="54px"
        width="100px"
      />
      <div
        v-else
        class="dashboard-top-info-right__item-currency is--h2__title"
      >
        {{ item.currency }}
        <span class="dashboard-top-info-right__item-coin is--small">
          {{ item.coin }}
        </span>
      </div>
      <VSkeleton
        v-if="isLoading"
        height="18px"
        width="100px"
      />
      <div
        v-else
        class="dashboard-top-info-right__item-change is--small"
        :class="item.changeClass"
      >
        {{ item.change }}% change in 30 days
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-top-info-right {
  $root: &;

  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;

  @media screen and (max-width: $tablet-xs){
    flex-direction: column;
  }

  &__item {
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;
    width: 100%;
  }

  &__item-label {
    color: $gray-70;
  }

  &__item-status {
    display: flex;
    align-items: center;
    align-self: stretch;
    padding-left: 12px;
    min-height: 32px;

    & + & {
      margin-top: 4px;
    }
    #{$root}__item-label {
      min-width: 174px;
    }
  }

  &__item-currency {
    color: $black;
  }

  &__item-coin {
    margin-left: -8px;
  }

  &__item-change {
    color: $gray-60;
    visibility: hidden;

    &.is--positive {
    color: $secondary-dark;
    }

    &.is--negative {
    color: $red;
    }

    &.is--show {
      visibility: visible;
    }
  }
}
</style>
