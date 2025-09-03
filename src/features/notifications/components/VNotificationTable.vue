<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormInputSearch from 'UiKit/components/Base/VForm/VFormInputSearch.vue';
import VFilter, { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { computed } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import check from 'UiKit/assets/images/check.svg';
import FilterPagination from 'InvestCommon/shared/components/VFilterPagination.vue';
import { VTabs, VTabsList, VTabsTrigger } from 'UiKit/components/Base/VTabs';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import VNotificationTableItem from 'InvestCommon/features/notifications/components/VNotificationTableItem.vue';
import VNotificationTableItemSkeleton from 'InvestCommon/features/notifications/components/VNotificationTableItemSkeleton.vue';

const props = defineProps({
  small: Boolean,
  isStaticSite: String, // is the component external and nee links instead of router
});

const notificationsStore = useNotifications();
const {
  filterSettings, tabsSettings, currentTab, search, showSearch,
  showFilter, filterResults, notificationUserLength, showMarkAll,
  showFilterPagination: showFilterPaginationStore,
  isLoading, tableData,
} = storeToRefs(notificationsStore);

const data = computed(() => (
  props.small ? tableData.value.slice(0, 15) : tableData.value));

const showFilterPagination = computed(() => (
  showFilterPaginationStore.value && !props.small && (filterResults.value > 0)));

const onMarkAllAsRead = () => {
  notificationsStore.markAllAsRead();
};
const onApplyFilter = (items: IVFilter[]) => {
  notificationsStore.onApplyFilter(items);
};
</script>
<template>
  <aside class="WdNotificationTable wd-notification-table is--no-margin">
    <div class="wd-notification-table__toolbar">
      <div class="wd-notification-table__toolbar-left">
        <VTabs
          v-model="currentTab"
          :default-value="currentTab"
          variant="secondary"
          tabs-to-url
          class="wd-notification-table__tabs"
        >
          <VTabsList
            variant="secondary"
          >
            <VTabsTrigger
              v-for="(tab, tabIndex) in tabsSettings"
              :key="tabIndex"
              :value="tab.value"
              variant="secondary"
            >
              {{ tab.label }}
            </VTabsTrigger>
          </VTabsList>
        </VTabs>
        <div
          v-if="!small"
          class="wd-notification-table__search"
        >
          <VFormInputSearch
            v-model="search"
            :disabled="!showSearch"
            size="small"
          />
        </div>
        <VFilter
          :items="filterSettings"
          :disabled="!showFilter"
          class="wd-notification-table__filter"
          @apply="onApplyFilter"
        />
        <FilterPagination
          :show-filter-pagination="showFilterPagination"
          :filter-results="filterResults"
          :total-length="notificationUserLength"
        />
      </div>
      <VButton
        size="small"
        variant="link"
        :disabled="!showMarkAll"
        class="wd-notification-table__mark-all"
        @click.stop="onMarkAllAsRead"
      >
        <check
          alt="download icon"
          class="wd-notification-table__check-icon"
        />
        Mark All as Read
      </VButton>
    </div>
    <VTableDefault
      :loading-row-length="10"
      :data="data"
      :loading="isLoading"
      size="small"
      :colspan="2"
    >
      <template
        v-for="item in data"
        :key="item.id"
      >
        <VNotificationTableItem
          :data="item"
          :search="search"
          :is-static-site="isStaticSite"
        />
      </template>
      <template #loading>
        <VNotificationTableItemSkeleton />
      </template>
      <template #empty>
        <p
          v-if="notificationUserLength === 0"
        >
          Currently no notifications yet.
        </p>
        <p
          v-else
        >
          Currently no notifications in this category.
        </p>
      </template>
    </VTableDefault>
  </aside>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.wd-notification-table {

  &__content {
    overflow-y: scroll;
    height: calc(100% - 49px);
    padding-right: 15px;
  }

  &__toolbar {
    display: flex;
    padding-bottom: 16px;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    justify-content: space-between;
    flex-wrap: wrap;

    @media screen and (max-width: $tablet){
      flex-direction: column-reverse;
    }
  }

  &__table-header {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    width: 100%;
    color: $gray-60;
    font-size: 14px;
    font-style: normal;
    font-weight: 800;
    line-height: 21px;
    padding-right: 80px;
  }

  &__toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 75%;
    flex-wrap: wrap;

    @media screen and (max-width: $tablet){
      min-width: auto;
      width: 100%;
    }
  }

  &__filter {
    --v-filter-dropdown-min-width: 250px;
  }

  &__mark-all {
    @media screen and (max-width: $tablet){
      align-self: flex-end;
    }
  }

  &__not-found {
    font-weight: 800;
    text-align: center;
    font-size: 18px;
    margin-top: 40px;
  }

  &__tabs {
    margin-right: 12px;
    flex-shrink: 0;

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__search {
    width: 32%;

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__check-icon {
    width: 16px;
  }
}
</style>
