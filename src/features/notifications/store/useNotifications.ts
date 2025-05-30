import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import type { INotification } from 'InvestCommon/types/api/notifications';
import { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';

export const useNotifications = defineStore('notifications', () => {
  const notificationsRepository = useRepositoryNotifications();
  const { formattedNotifications, error, isLoadingGetAll } = storeToRefs(notificationsRepository);
  const usersStore = useUsersStore();
  const { userLoggedIn } = storeToRefs(usersStore);

  /* * Loading State * */
  const isLoading = ref(true);

  // Watch for notification changes to update loading state
  watch([formattedNotifications, error, isLoadingGetAll], ([newNotification, newError, newLoading]) => {
    // Set loading state based on repository loading state
    if (newLoading) {
      isLoading.value = true;
    // Stop loading if we have data, empty array, or an error
    } else if (Array.isArray(newNotification) || newError) {
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }
  });

  /* * Data * */
  const notificationUserData = computed(() => (
    formattedNotifications.value?.filter((item: INotification) => item.type !== 'internal') || []));
  const notificationUserLength = computed(() => notificationUserData.value.length);
  const notificationUnreadData = computed(() => (
    notificationUserData.value.filter((item: INotification) => item.status === 'unread')));
  const notificationUnreadLength = computed(() => notificationUnreadData.value.length);

  /* * Loading All Data * */
  const canLoadAllData = computed(() => userLoggedIn.value);
  const conditionToLoadAllData = computed(() => (
    !isLoadingGetAll.value && (formattedNotifications.value.length === 0) && !error.value));

  const loadData = () => {
    if (canLoadAllData.value && conditionToLoadAllData.value) {
      notificationsRepository.getAll();
    }
  };

  /* * Page Settings * */
  const filterSettings = ref([
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

  const tabsSettings = ref([
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
  ]);
  const currentTab = ref(tabsSettings.value[0].value);
  const search = ref('');
  const filterStatus = ref<string[]>([]);
  const filterType = ref<string[]>([]);

  const notificationsFilterTypeAll = computed(() => notificationUserData.value);
  const notificationsFilterTypeInvestments = computed(() => (
    notificationUserData.value?.filter((item) => (item.type?.toLowerCase().includes('investment')))));
  const notificationsFilterTypeAccounts = computed(() => (
    notificationUserData.value?.filter((item) => (item.type?.toLowerCase().includes('profile')))));
  const notificationsFilterTypeDocuments = computed(() => (
    notificationUserData.value?.filter((item) => (item.type?.toLowerCase().includes('document')))));

  const tabsData = computed(() => {
    if (currentTab.value === 'investments') {
      return notificationsFilterTypeInvestments.value;
    }
    if (currentTab.value === 'accounts') {
      return notificationsFilterTypeAccounts.value;
    }
    if (currentTab.value === 'document') {
      return notificationsFilterTypeDocuments.value;
    }
    return notificationsFilterTypeAll.value;
  });

  const tabsDataFilterStatus = computed(() => (
    tabsData.value?.filter((item) => (filterStatus.value?.includes(item.status?.toLowerCase())))));
  const tabsDataFilterType = computed(() => (
    tabsData.value?.filter((item) => (filterType.value?.includes(item.type?.toLowerCase())))));

  const filterData = computed(() => {
    let filtered = tabsData.value;
    if (filterStatus.value && (filterStatus.value?.length > 0)) {
      filtered = tabsDataFilterStatus.value;
    }
    if (filterType.value && (filterType.value?.length > 0)) {
      filtered = tabsDataFilterType.value;
    }
    return filtered;
  });

  const tableData = computed(() => {
    // Only show loading state if we're loading AND don't have any existing data
    // AND we're not just filtering existing data
    if (isLoading.value && (formattedNotifications.value.length === 0) && (currentTab.value === 'all')) {
      return Array(10).fill({
        status: '',
        type: '',
        content: '',
      });
    }

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

  const filterResults = computed(() => tableData.value?.length);
  const showSearch = computed(() => notificationsFilterTypeAll.value.length > 0);
  const showFilter = computed(() => notificationsFilterTypeAll.value.length > 0);
  const showFilterPagination = computed(() => (
    Boolean(notificationUserLength.value && (notificationUserLength.value > 0) && (filterResults.value > 0))));
  const showMarkAll = computed(() => (filterResults.value > 0 && (notificationUnreadLength.value > 0)));

  const markAllAsRead = async () => {
    notificationsRepository.markAllAsRead();
    // notificationsRepository.getAll();
  };

  const onApplyFilter = (items: IVFilter[]) => {
    filterSettings.value = items;

    const statusObject = items?.filter((item: IVFilter) => item.value === 'status')[0];
    if (!statusObject) {
      filterStatus.value = [];
    } else {
      filterStatus.value = statusObject?.model?.map((item: string) => item.toLowerCase());
    }

    const typeObject = items?.filter((item: IVFilter) => item.value === 'type')[0];
    if (!typeObject) {
      filterType.value = [];
    } else {
      filterType.value = typeObject?.model?.map((item: string) => item.toLowerCase());
    }
  };

  const clearFilterType = () => {
    filterType.value = [];
    if (filterSettings.value[1]) {
      filterSettings.value[1].model = [];
    }
  };
  const clearFilterStatus = () => {
    filterStatus.value = [];
    if (filterSettings.value[0]) {
      filterSettings.value[0].model = [];
    }
  };
  const clearTab = () => {
    currentTab.value = tabsSettings.value[0].value;
  };
  const clearSearch = () => {
    search.value = '';
  };

  const handleTabChange = () => {
    clearSearch();
    if (currentTab.value !== 'all') {
      clearFilterType();
    }
  };

  watch(() => search.value, () => {
    if (search.value) {
      clearFilterType();
      clearFilterStatus();
      clearTab();
    }
  });

  watch(() => filterSettings.value[1].model.length, () => {
    if (filterSettings.value[1].model.length > 0) {
      clearSearch();
      clearTab();
    }
  });
  watch(() => currentTab.value, () => {
    handleTabChange();
  });

  /* * Sidebar * */
  const isSidebarOpen = ref(false);
  const onSidebarToggle = (value: boolean) => {
    isSidebarOpen.value = value;
  };

  /* * Mark As Read By Id * */
  const markAsReadById = async (id: number) => {
    if (!id) {
      return;
    }
    notificationsRepository.markAsReadById(id);
  };

  return {
    isLoading,
    formattedNotifications,
    notificationUnreadLength,
    loadData,
    markAllAsRead,
    filterSettings,
    tabsSettings,
    currentTab,
    search,
    showSearch,
    showFilter,
    filterResults,
    notificationUserLength,
    showMarkAll,
    tableData,
    onApplyFilter,
    showFilterPagination,
    onSidebarToggle,
    isSidebarOpen,
    markAsReadById,
    clearFilterType,
    clearFilterStatus,
    clearSearch,
    clearTab,
    // Expose state properties for testing
    filterStatus,
    filterType,
    // Expose computed properties for testing
    notificationUserData,
    tabsData,
    filterData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotifications, import.meta.hot));
}
