<script setup lang="ts">
import {
  defineAsyncComponent, onMounted, watch,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import DashboardTabsTopInfo from '@/views/Dashboard/components/DashboardTabsTopInfo.vue';
import { storeToRefs } from 'pinia';
import DashboardDistributionsSummary from './components/DashboardDistributionsSummary.vue';
import { useRepositoryDistributions } from 'InvestCommon/data/distributions/distributions.repository';


const DISTRIBUTIONS_TAB_INFO = {
  title: 'Your Total Assets',
};

const VApexChartArea = defineAsyncComponent({
  loader: () => import('UiKit/components/VCharts/VApexChartArea.vue'),
});

const VApexChartDonut = defineAsyncComponent({
  loader: () => import('UiKit/components/VCharts/VApexChartDonut.vue'),
});

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const distributionsRepository = useRepositoryDistributions();
const {
  getDistributionsState, distributionPerformanceLabels, distributionPerformanceData,
  distributionGeograficLabels, distributionGeograficData,
} = storeToRefs(distributionsRepository);

const updateData = () => {
  if (!getDistributionsState.value.loading && userLoggedIn.value && (selectedUserProfileId.value > 0)) {
    distributionsRepository.getDistributions(selectedUserProfileId.value);
  }
};

watch(() => selectedUserProfileId.value, (value) => {
  if (value && value > 0) {
    updateData();
  }
});

onMounted(() => {
  updateData();
});

</script>

<template>
  <div class="DashboardDistributions dashboard-distributions">
    <DashboardTabsTopInfo
      :title="DISTRIBUTIONS_TAB_INFO.title"
    />
    <div
      v-if="(distributionGeograficData.length > 0) || (distributionPerformanceData.length > 0)"
      class="dashboard-distributions__charts"
    >
      <VApexChartDonut
        v-if="distributionGeograficData.length > 0"
        title="Geographic Diversification"
        :data="distributionGeograficData"
        :labels="distributionGeograficLabels"
        class="dashboard-distributions__chart-pie"
      />
      <VApexChartArea
        v-if="distributionPerformanceData.length > 0"
        name="Distributions"
        title="Portfolio Performance"
        :data="distributionPerformanceData"
        :labels="distributionPerformanceLabels"
        class="dashboard-distributions__chart-area"
      />
    </div>
    <DashboardDistributionsSummary />
  </div>
</template>

<style lang="scss">
.dashboard-distributions {
  &__charts {
    display: flex;
    gap: 80px;
    width: 100%;
    margin-bottom: 40px;
    justify-content: space-between;

    @media screen and (max-width: $desktop){
      flex-direction: column;
      gap: 40px;
    }
  }

  &__chart-area {
    width: 65%;
  }

  &__chart-pie {
    width: 30%;
  }
}
</style>
