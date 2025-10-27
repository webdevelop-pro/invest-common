<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { DashboardInvestmentTabTypes } from './utils';
import VBreadcrumbs from 'UiKit/components/VBreadcrumb/VBreadcrumbsList.vue';
import { computed, PropType } from 'vue';
import { storeToRefs } from 'pinia';
import {
  ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_PORTFOLIO, ROUTE_INVESTMENT_DOCUMENTS, ROUTE_INVESTMENT_TIMELINE,
} from 'InvestCommon/domain/config/enums/routes';
import { useRoute, useRouter } from 'vue-router';
import VPageTopInfoAndTabs from 'InvestCommon/shared/components/VPageTopInfoAndTabs.vue';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import InvestmentDocuments from 'InvestCommon/features/investment/components/InvestmentDocuments.vue';
import InvestmentTimeline from 'InvestCommon/features/investment/components/InvestmentTimeline.vue';
import InvestmentTopInfo from 'InvestCommon/features/investment/components/InvestmentTopInfo.vue';

defineProps({
  tab: {
    type: String as PropType<DashboardInvestmentTabTypes>,
    required: true,
    validator: (prop: DashboardInvestmentTabTypes) => prop in DashboardInvestmentTabTypes,
  },
});

const globalLoader = useGlobalLoader();
globalLoader.hide();

const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
const router = useRouter();
const route = useRoute();
const investmentID = computed(() => router.currentRoute.value.params.id);

const breadcrumbs = computed(() => ([
  {
    text: 'Dashboard',
    to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
  },
  {
    text: 'Portfolio',
    to: { name: ROUTE_DASHBOARD_PORTFOLIO, params: { profileId: selectedUserProfileId.value } },
  },
  {
    text: `ID ${String(router.currentRoute.value.params.id)}`,
  },
]));

const tabs = computed(() => ({
  [DashboardInvestmentTabTypes.documents]: {
    value: DashboardInvestmentTabTypes.documents,
    label: 'Investment Documents',
    to: {
      name: ROUTE_INVESTMENT_DOCUMENTS,
      params: {
        profileId: selectedUserProfileId.value,
        id: route.params.id,
      },
    },
  },
  [DashboardInvestmentTabTypes.timeline]: {
    value: DashboardInvestmentTabTypes.timeline,
    label: 'Investment Timeline',
    to: {
      name: ROUTE_INVESTMENT_TIMELINE,
      params: {
        profileId: selectedUserProfileId.value,
        id: route.params.id,
      },
    },
  },
}) as const);
</script>

<template>
  <VPageTopInfoAndTabs
    :tab="tab"
    :tabs="tabs"
    class="ViewInvestmentDocuments view-investment-documents is--no-margin"
  >
    <template #top-info>
      <InvestmentTopInfo
        :investment-id="investmentID"
        :profile-data="selectedUserProfileData"
      />
    </template>
    <template #tabs-content>
      <VTabsContent
        :value="tabs.timeline.value"
      >
        <InvestmentTimeline
          :investment-id="investmentID"
        />
      </VTabsContent>
      <VTabsContent
        :value="tabs.documents.value"
      >
        <InvestmentDocuments
          :investment-id="investmentID"
        />
      </VTabsContent>
    </template>
    <template #content>
      <div class="view-investment-documents__breadcrumbs-wrap">
        <div class="wd-container">
          <VBreadcrumbs
            :data="breadcrumbs"
            class="view-investment-documents__breadcrumbs"
          />
        </div>
      </div>
    </template>
  </VPageTopInfoAndTabs>
</template>

<style lang="scss">
.view-investment-documents {

  &__breadcrumbs-wrap {
    width: 100%;
    background: $white;
    padding-top: 130px;

    @media screen and (max-width: $tablet){
      padding-top: 40px;
    }
  }
}
</style>
