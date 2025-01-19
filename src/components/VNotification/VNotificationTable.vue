<script setup lang="ts">
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import VNotificationTableItem from 'InvestCommon/components/VNotification/VNotificationTableItem.vue';
import VTable from 'UiKit/components/Base/VTable/VTable.vue';
import { storeToRefs } from 'pinia';
import VFormInputSearch from 'UiKit/components/Base/VForm/VFormInputSearch.vue';
import VContentSwitcher from 'UiKit/components/Base/VContentSwitcher/VContentSwitcher.vue';
import VFilter, { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import { computed, ref, watch } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import check from 'UiKit/assets/images/check.svg';
import FilterPagination from 'InvestCommon/components/common/FilterPagination.vue';

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
  if (currentTab.value.value === 'all') return notificationsFilteredSize.value;
  if (currentTab.value.value === 'investments') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('investment')));
  }
  if (currentTab.value.value === 'accounts') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('profile')));
  }
  if (currentTab.value.value === 'document') {
    filtered = notificationsFilteredSize.value?.filter((item) => (item.type?.toLowerCase().includes('documents')));
  }

  return filtered;
});

const filterData = computed(() => {
  let filtered = tabsData.value;
  if (filterStatus.value && (filterStatus.value?.length > 0)) {
    filtered = filtered?.filter((item) => (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      filterStatus.value?.includes(item.status?.toLowerCase())
    ));
  }
  if (filterType.value && (filterType.value?.length > 0)) {
    filtered = filtered?.filter((item) => (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
const showSearch = computed(() => filterResults.value > 0);
const showFilter = computed(() => filterResults.value > 0);
const showFilterPagination = computed(() => (
  Boolean(notificationUserLength.value && (notificationUserLength.value > 0)
  && !props.small && (filterResults.value > 0))));
const showMarkAll = computed(() => (filterResults.value > 0 && (notificationUnreadLength.value > 0)));

const onApplyFilter = (items: IVFilter[]) => {
  filterNotifications.value = items;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const statusObject = items?.filter((item: IVFilter) => item.value === 'status')[0];
  if (!statusObject) filterStatus.value = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  else filterStatus.value = statusObject?.model?.map((item: string) => item.toLowerCase());

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const typeObject = items?.filter((item: IVFilter) => item.value === 'type')[0];
  if (!typeObject) filterType.value = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  else filterType.value = typeObject?.model?.map((item: string) => item.toLowerCase());
};

const clearFilterType = () => {
  // clear tab
  filterType.value = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  filterNotifications.value[1].model = [];
};
const clearFilterStatus = () => {
  // clear tab
  filterStatus.value = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
  if (currentTab.value.value === 'all') {
    lockFilter.value = false;
  } else {
    lockFilter.value = true;
    clearFilterType();
  }
};

const onChangeTab = (value: string) => {
  const tab = tabs.find((item) => item.value === value);
  if (tab) currentTab.value = tab;
  handleTabChange();
};

const onMarkAllAsRead = async () => {
  await notificationsStore.markAllAsRead();
  void notificationsStore.getNotificationsAll();
};

watch(() => search.value, () => {
  if (search.value) {
    clearFilterType();
    clearFilterStatus();
    clearTab();
  }
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
watch(() => filterNotifications.value[1].model.length, () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (filterNotifications.value[1].model.length > 0) {
    clearSearch();
    clearTab();
  }
});
</script>
<template>
  <aside class="WdNotificationTable wd-notification-table is--no-margin">
    <div class="wd-notification-table__toolbar">
      <div class="wd-notification-table__toolbar-left">
        <VContentSwitcher
          :model-value="currentTab.value"
          :tabs="tabs"
          class="wd-notification-table__tabs"
          @update:model-value="onChangeTab"
        />
        <VFormInputSearch
          v-if="!small"
          v-model="search"
          :disabled="!showSearch"
          size="small"
          class="wd-notification-table__search"
        />
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
        icon-placement="left"
        @click.stop="onMarkAllAsRead"
      >
        <check
          alt="download icon"
          class="wd-notification-table__check-icon"
        />
        Mark All as Read
      </VButton>
    </div>
    <VSkeleton
      v-if="isGetNotificationsLoading"
      height="22px"
      width="100%"
      class="wd-notification-table__skeleton"
    />
    <div
      v-else
      class="wd-notification-table__content"
    >
      <VTable
        v-if="searchData.length > 0"
        size="small"
      >
        <tbody>
          <VNotificationTableItem
            v-for="item in searchData"
            :key="item.id"
            :data="item"
            :search="search"
            :external="external"
          />
        </tbody>
      </VTable>
      <div
        v-else-if="notificationUserLength === 0"
        class="is--table-not-found is--table-cell is--body"
      >
        Currently no notifications yet.
      </div>
      <div
        v-else
        class="is--table-not-found is--table-cell is--body"
      >
        Currently no notifications in this category.
      </div>
    </div>
  </aside>
</template>

<style lang="scss">
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
  }

  &__filter {
    --V-filter-dropdown--min-width: 250px;
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
  }

  &__search {
    width: 32%;
  }

  &__check-icon {
    width: 16px;
  }
}
</style>
