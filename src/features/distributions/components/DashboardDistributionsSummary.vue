<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { IDistributionsData } from 'InvestCommon/types/api/distributions';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import { urlProfilePortfolio } from 'InvestCommon/domain/config/links';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableDistributionsItem from './VTableDistributionsItem.vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryDistributions } from 'InvestCommon/data/distributions/distributions.repository';

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

const distributionsRepository = useRepositoryDistributions();
const { getDistributionsState } = storeToRefs(distributionsRepository);

const filterPortfolio = ref([
  {
    value: 'status',
    title: 'By status:',
    options: [
      'Success',
      'Pending',
    ],
    model: [] as string[],
  },
] as IVFilter[]);

const distributionsTableHeader = [
  { text: '' },
  { text: 'ID' },
  { text: 'Offer' },
  { text: 'Date' },
  { text: 'Investment' },
  { text: 'Ownership' },
  { text: 'Total Distribution' },
  { text: 'Status' },
  { text: '' },
];

const distributions = computed(() => getDistributionsState.value.data || []);
const totalResults = computed(() => distributions.value?.length || 0);

const search = ref();
const fundingStatus = ref<string[]>([]);
const isFiltering = computed(() => (
  filterPortfolio.value?.find((item) => item?.model?.length > 0) || (search.value?.length > 0)));

const filterData = computed(() => {
  let filtered = distributions.value;
  // status
  if (fundingStatus.value && (fundingStatus.value?.length > 0)) {
    filtered = filtered?.filter((item: IDistributionsData) => (
      fundingStatus.value?.includes(item.status?.toLowerCase())
    ));
  }

  // Ensure confirmedOffers is returned when search is falsy
  return filtered;
});

const searchData = computed(() => {
  // Access the value of search
  const searchValue = search.value ? String(search.value).toLowerCase() : '';

  if (searchValue) {
    const filtered = filterData.value?.filter((item: IDistributionsData) => (
      (String(item.id).toLowerCase().includes(searchValue))
      || (item.investment?.offer?.name?.toLowerCase()?.includes(searchValue))
    ));
    return filtered;
  }
  // Ensure confirmedOffers is returned when search is falsy
  return filterData.value;
});

const filterResults = computed(() => searchData.value?.length || 0);

const onApplyFilter = (items: IVFilter[]) => {
  filterPortfolio.value = items;
  // filter status

  const fundingStatusObject = items?.filter((item: IVFilter) => item.value === 'status')[0];
  if (!fundingStatusObject) fundingStatus.value = [];

  fundingStatus.value = fundingStatusObject?.model?.map((item: string) => item.toLowerCase());
};

</script>

<template>
  <div class="DashboardDistributionsSummary dashboard-distributions-summary">
    <h3 class="is--h3__title">
      Investment Summary
    </h3>
    <VTableToolbar
      v-model="search"
      :filter-items="filterPortfolio"
      :filter-results-length="filterResults"
      :total-results-length="totalResults"
      @filter-items="onApplyFilter"
    />
    <VTableDefault
      :loading-row-length="10"
      :header="distributionsTableHeader"
      :loading="getDistributionsState.loading && (searchData?.length === 0)"
      :data="searchData"
      :colspan="9"
    >
      <VTableDistributionsItem
        v-for="item in searchData"
        :key="item.id"
        :item="item"
        :search="search"
        :colspan="distributionsTableHeader.length"
      />
      <template #empty>
        You have no distributions
        <span v-if="(filterResults === 0) && isFiltering">
          matching your criteria
        </span>
        <span v-else> yet. </span>
        Check out
        <a
          :href="urlProfilePortfolio(selectedUserProfileId)"
          class="is--link-1"
        >
          your investments.
        </a>
      </template>
    </VTableDefault>
  </div>
</template>

<style lang="scss">
.dashboard-distributions-summary {
  margin-top: 40px;
}
</style>
