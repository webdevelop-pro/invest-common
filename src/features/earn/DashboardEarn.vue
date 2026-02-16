<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableYieldItem from './components/VTableYieldItem.vue';
import { useEarnTable } from './composables/useEarnTable';
import { useWalletAlert } from 'InvestCommon/features/wallet/logic/useWalletAlert';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
});

interface TableHeader {
  text: string;
  class?: string;
}

const globalLoader = useGlobalLoader();

const TABLE_HEADERS: TableHeader[] = [
  { text: 'Asset' },
  { text: 'TVL' },
  { text: 'APY' },
  { text: 'Base APY', class: 'is--gt-desktop-show' },
  { text: 'Reward APY', class: 'is--gt-desktop-show' },
  { text: '30d Avg APY', class: 'is--gt-desktop-show' },
  { text: 'Type', class: 'is--gt-desktop-show' },
  { text: 'Actions', class: 'is--gt-desktop-show' },
];

const EARN_TAB_INFO = {
  title: 'Earn',
  subTitle: 'Yield opportunities',
  text: 'Discover earning opportunities and explore ways to grow your wealth and maximize returns. Explore Aave lending pools with the highest yields. Data provided by DefiLlama.',
} as const;

const {
  search,
  loading,
  visibleData,
  totalResults,
  filterResults,
  hasMore,
  sentinel,
  onRowClick,
} = useEarnTable();

const {
  isAlertShow,
  isTopTextShow,
  showTable,
  isAlertType,
  isAlertText,
  alertTitle,
  alertButtonText,
  onAlertButtonClick,
} = useWalletAlert();

const dialogsStore = useDialogs();

const handleContactUsClick = (event: Event) => {
  const target = (event.target as HTMLElement)?.closest('[data-action="contact-us"]');
  if (target) {
    event.preventDefault();
    event.stopPropagation();
    dialogsStore.openContactUsDialog('earn');
  }
};

const showEmptyMessage = computed(() => filterResults.value === 0 && search.value.trim().length > 0);

onMounted(() => {
  globalLoader.hide();
});
</script>

<template>
  <div class="DashboardEarn dashboard-earn">
    <DashboardTabsTopInfo
      v-if="isTopTextShow"
      :title="EARN_TAB_INFO.title"
      :sub-title="EARN_TAB_INFO.subTitle"
      :text="EARN_TAB_INFO.text"
    />
    <VAlert
      v-if="isAlertShow"
      :variant="isAlertType"
      data-testid="earn-alert"
      class="dashboard-earn__alert"
      :button-text="alertButtonText"
      @click="onAlertButtonClick"
    >
      <template
        v-if="alertTitle"
        #title
      >
        {{ alertTitle }}
      </template>
      <template 
        v-if="isAlertText"
        #description
      >
        <span
          v-dompurify-html="isAlertText"
          role="button"
          tabindex="0"
          @click="handleContactUsClick"
          @keydown.enter="handleContactUsClick"
          @keydown.space.prevent="handleContactUsClick"
        />
      </template>
    </VAlert>
    <div
      v-if="showTable"
      class="dashboard-earn__tablet"
    >
      <h3 class="dashboard-earn__title is--h3__title">
        Available Assets to Supply
      </h3>

      <VTableToolbar
        v-model="search"
        :filter-results-length="filterResults"
        :total-results-length="totalResults"
      />
      <VTableDefault
        :loading-row-length="10"
        :header="TABLE_HEADERS"
        :loading="loading"
        :data="visibleData"
        :colspan="TABLE_HEADERS.length"
      >
        <VTableYieldItem
          v-for="pool in visibleData"
          :key="pool.pool"
          :data="pool"
          :search="search"
          @row-click="onRowClick"
        />
        <template #empty>
          <span v-if="showEmptyMessage">
            No pools found matching "{{ search }}"
          </span>
          <span v-else>
            No yield data available at this time.
          </span>
        </template>
      </VTableDefault>
      <div
        v-if="hasMore && !loading"
        ref="sentinel"
        class="dashboard-earn__sentinel"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-earn {
  $root: &;

  .v-table-toolbar__search {
    width: 50%;
  }

  &__tablet {
    margin-top: 40px;

    @media screen and (max-width: $tablet) {
      width: 100%;
      overflow: auto;
      margin-top: 20px;
    }
  }

  &__title {
    margin-bottom: 0;
  }

  &__alert {
    margin-bottom: 0 !important;
  }

  &__sentinel {
    height: 1px;
    width: 100%;
  }

  // Align first and last columns consistently with cell content
  .v-table-head:first-of-type {
    text-align: left;
  }

  .v-table-head:last-of-type {
    text-align: right;
  }
}
</style>

