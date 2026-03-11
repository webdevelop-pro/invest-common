<script setup lang="ts">
import {
  computed, defineAsyncComponent, onMounted, watch,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';;
import { storeToRefs } from 'pinia';
import DashboardDistributionsSummary from './components/DashboardDistributionsSummary.vue';
import { useRepositoryDistributions } from 'InvestCommon/data/distributions/distributions.repository';
import { reportError } from 'InvestCommon/domain/error/errorReporting';

// todo: need to refactor

const DISTRIBUTIONS_TAB_INFO = {
  title: 'Your Total Assets',
};

const VShadcnChartArea = defineAsyncComponent({
  loader: () => import('UiKit/components/VCharts/VShadcnChartArea/VShadcnChartArea.vue'),
});

const VShadcnChartDonut = defineAsyncComponent({
  loader: () => import('UiKit/components/VCharts/VShadcnChartDonut/VShadcnChartDonut.vue'),
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
    distributionsRepository.getDistributions(selectedUserProfileId.value)
      .catch((e) => reportError(e, 'Failed to load distributions'));
  }
};

const geographicChartData = computed(() => distributionGeograficData.value.map((value, index) => ({
  name: String(distributionGeograficLabels.value[index] ?? index + 1),
  value,
})));

const performanceChartData = computed(() => distributionPerformanceData.value.map((value, index) => ({
  label: String(distributionPerformanceLabels.value[index] ?? index + 1),
  value,
})));

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
      <VShadcnChartDonut
        v-if="distributionGeograficData.length > 0"
        title="Geographic Diversification"
        :data="geographicChartData"
        index="name"
        category="value"
        :show-center="false"
        class="dashboard-distributions__chart-pie"
      />
      <VShadcnChartArea
        v-if="distributionPerformanceData.length > 0"
        title="Portfolio Performance"
        :data="performanceChartData"
        :categories="['value']"
        index="label"
        :show-legend="false"
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
