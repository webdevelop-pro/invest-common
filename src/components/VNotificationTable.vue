<script setup lang="ts">
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import VNotificationTableItem from 'InvestCommon/components/tables/VTableNotificationItem.vue';
import { storeToRefs } from 'pinia';
import VFormInputSearch from 'UiKit/components/Base/VForm/VFormInputSearch.vue';
import VFilter, { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { computed, ref, watch } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import check from 'UiKit/assets/images/check.svg';
import FilterPagination from 'InvestCommon/components/VFilterPagination.vue';
import { VTabs, VTabsList, VTabsTrigger } from 'UiKit/components/Base/VTabs';
import VTableDefault from 'InvestCommon/components/tables/VTableDefault.vue';

const props = defineProps({
  small: Boolean,
  external: Boolean, // is the component external and nee links instead of router
});

const filterNotifications = ref([
  {
    value: 'status',
    title: 'By status:',
    options: [
      'Read',
      'Unread',
    ],
    model: [] as string[],
  },
  {
    value: 'type',
    title: 'By tag:',
    options: [
      'Investment',
      'System',
      'Tax Document/Offer Update',
      'Profile',
      'Wallet',
    ],
    model: [] as string[],
  },
] as IVFilter[]);

const tabs = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: 'investments',
    label: 'Investments',
  },
  {
    value: 'accounts',
    label: 'Investment Profiles',
  },
  {
    value: 'document',
    label: 'Documents',
  },
];

const notificationsStore = useNotificationsStore();
const {
  notificationUserData: notifications, notificationUserLength, isGetNotificationsLoading,
  notificationUnreadLength,
} = storeToRefs(notificationsStore);

const search = ref('');
const filterStatus = ref<string[]>([]);
const filterType = ref<string[]>([]);
const currentTab = ref(tabs[0]);
const lockFilter = ref(false);
const notificationsFilteredSize = computed(() => (
  props.small ? notifications.value.slice(0, 15) : notifications.value));

const tabsData = computed(() => {
  let filtered = notificationsFilteredSize.value;
  if (currentTab.value === 'all') return notificationsFilteredSize.value;
  if (currentTab.value === 'investments') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('investment')));
  }
  if (currentTab.value === 'accounts') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('profile')));
  }
  if (currentTab.value === 'document') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('documents')));
  }

  return filtered;
});

const filterData = computed(() => {
  let filtered = tabsData.value;
  if (filterStatus.value && (filterStatus.value?.length > 0)) {
    filtered = filtered?.filter((item) => (

      filterStatus.value?.includes(item.status?.toLowerCase())
    ));
  }
  if (filterType.value && (filterType.value?.length > 0)) {
    filtered = filtered?.filter((item) => (

      filterType.value?.includes(item.type?.toLowerCase())
    ));
  }

  return filtered;
});

const searchData = computed(() => {
  // Access the value of search
  const searchValue = search.value ? String(search.value).toLowerCase() : '';

  if (searchValue) {
    const filtered = filterData.value?.filter((item) => (
      (item.status.toLowerCase().includes(searchValue))
      || (item.type.toLowerCase().includes(searchValue))
      || (item.content.toLowerCase().includes(searchValue))
    ));
    return filtered;
  }

  // Ensure confirmedOffers is returned when search is falsy
  return filterData.value;
});

const filterResults = computed(() => searchData.value?.length);
const showSearch = computed(() => filterResults.value.length > 0);
const showFilter = computed(() => tabsData.value.length > 0);
const showFilterPagination = computed(() => (
  Boolean(notificationUserLength.value && (notificationUserLength.value > 0)
  && !props.small && (filterResults.value > 0))));
const showMarkAll = computed(() => (filterResults.value > 0 && (notificationUnreadLength.value > 0)));

const onApplyFilter = (items: IVFilter[]) => {
  filterNotifications.value = items;

  const statusObject = items?.filter((item: IVFilter) => item.value === 'status')[0];
  if (!statusObject) filterStatus.value = [];

  else filterStatus.value = statusObject?.model?.map((item: string) => item.toLowerCase());

  const typeObject = items?.filter((item: IVFilter) => item.value === 'type')[0];
  if (!typeObject) filterType.value = [];

  else filterType.value = typeObject?.model?.map((item: string) => item.toLowerCase());
};

const clearFilterType = () => {
  // clear tab
  filterType.value = [];

  filterNotifications.value[1].model = [];
};
const clearFilterStatus = () => {
  // clear tab
  filterStatus.value = [];

  filterNotifications.value[0].model = [];
};
const clearTab = () => {
  // eslint-disable-next-line prefer-destructuring
  currentTab.value = tabs[0];
};
const clearSearch = () => {
  search.value = '';
};

const handleTabChange = () => {
  clearSearch();
  if (currentTab.value === 'all') {
    lockFilter.value = false;
  } else {
    lockFilter.value = true;
    clearFilterType();
  }
};

const onMarkAllAsRead = async () => {
  await notificationsStore.markAllAsRead();
  notificationsStore.getNotificationsAll();
};

watch(() => search.value, () => {
  if (search.value) {
    clearFilterType();
    clearFilterStatus();
    clearTab();
  }
});

watch(() => filterNotifications.value[1].model.length, () => {
  if (filterNotifications.value[1].model.length > 0) {
    clearSearch();
    clearTab();
  }
});
watch(() => currentTab.value, () => {
  handleTabChange();
});
</script>
<template>
  <aside class="WdNotificationTable wd-notification-table is--no-margin">
    <div class="wd-notification-table__toolbar">
      <div class="wd-notification-table__toolbar-left">
        <VTabs
          v-model="currentTab"
          :default-value="tabs[0].value"
          variant="secondary"
          class="wd-notification-table__tabs"
        >
          <VTabsList
            variant="secondary"
          >
            <VTabsTrigger
              v-for="(tab, tabIndex) in tabs"
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
          :items="filterNotifications"
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
      :loading="isGetNotificationsLoading && (searchData?.length === 0)"
      :data="searchData"
      size="small"
    >
      <Suspense>
        <VNotificationTableItem
          v-for="item in searchData"
          :key="item.id"
          :data="item"
          :search="search"
          :external="external"
        />
      </Suspense>
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
