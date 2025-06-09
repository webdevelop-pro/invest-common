import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref, nextTick } from 'vue';
import { fetchGetWalletByProfile } from 'InvestCommon/services/api/evm';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { useUsersStore } from '../useUsers';

const STATUS_CREATED = 'created';
const STATUS_ERROR = 'error';
const STATUS_VERIFIED = 'verified';
const STATUS_ERROR_RETRY = 'error_retry';
const STATUS_ERROR_DOCUMENT = 'error_document';
const STATUS_ERROR_PENDING = 'error_pending';
const STATUS_ERROR_SUSPENDED = 'error_suspended';
// account wallet data

export const useProfileEvmWalletStore = defineStore('Evmwallet', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileId } = storeToRefs(usersStore);

  const isGetEvmWalletByProfileIdLoading = ref(false);
  const getEvmWalletByProfileIdError = ref();
  const getEvmWalletByProfileIdData = ref();
  const getEvmWalletByProfileId = async (profileId: string) => {
    isGetEvmWalletByProfileIdLoading.value = true;
    getEvmWalletByProfileIdError.value = null;
    const response = await fetchGetWalletByProfile(profileId)
      .catch(async (error: Response) => {
        const errorJson = await error.json();
        getEvmWalletByProfileIdError.value = errorJson;
      });
    if (response) getEvmWalletByProfileIdData.value = response;
    isGetEvmWalletByProfileIdLoading.value = false;
  };

  const evmWalletId = computed(() => getEvmWalletByProfileIdData.value?.id || 0);

  // FORMATTED WALLET DATA
  const getEvmFormattedProfileWalletData = computed(() => ({
    ...getEvmWalletByProfileIdData.value,
  }));

  // WALLET STATUS
  const isEvmWalletStatusCreated = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_CREATED
  ));
  const isEvmWalletStatusVerified = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_VERIFIED
  ));
  const isEvmWalletStatusError = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_ERROR
  ));
  const isEvmWalletStatusErrorRetry = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_ERROR_RETRY
  ));
  const isEvmWalletStatusErrorDocument = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_ERROR_DOCUMENT
  ));
  const isEvmWalletStatusErrorPending = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_ERROR_PENDING
  ));
  const isEvmWalletStatusErrorSuspended = computed(() => (
    getEvmWalletByProfileIdData.value?.status === STATUS_ERROR_SUSPENDED
  ));
  const isEvmWalletStatusAnyError = computed(() => (
    isEvmWalletStatusError.value || isEvmWalletStatusErrorRetry.value || isEvmWalletStatusErrorDocument.value
    || isEvmWalletStatusErrorPending.value || isEvmWalletStatusErrorSuspended.value
  ));

  // BALANCE
  const evmCurrentBalance = computed(() => Number(getEvmWalletByProfileIdData.value?.balance) * 0.1 || 0);
  const evmBalances = computed(() => getEvmWalletByProfileIdData.value?.balances || []);
  const evmWalletAddress = computed(() => getEvmWalletByProfileIdData.value?.address || '');
  const evmPendingIncomingBalance = computed(() => getEvmWalletByProfileIdData.value?.pending_incoming_balance || 0);
  const evmPendingOutcomingBalance = computed(() => getEvmWalletByProfileIdData.value?.pending_outcoming_balance || 0);
  const isEvmCurrentBalanceZero = computed(() => (evmCurrentBalance.value === 0));
  const evmTotalBalance = computed(() => (
    evmCurrentBalance.value + evmPendingIncomingBalance.value - evmPendingOutcomingBalance.value));
  const isEvmTotalBalanceZero = computed(() => (evmTotalBalance.value === 0));

  const isEvmCanWithdraw = computed(() => !isEvmCurrentBalanceZero.value);

  const updateData = () => {
    if (!isGetEvmWalletByProfileIdLoading.value) {
      getEvmWalletByProfileId(selectedUserProfileId.value);
    }
  };

  const updateNotificationData = (notification: INotification) => {
    if (notification.data.fields?.balance) getEvmWalletByProfileIdData.value.balance = notification.data.fields?.balance;
    if (notification.data.fields?.balances) getEvmWalletByProfileIdData.value.balances = notification.data.fields?.balances;
    if (notification.data.fields?.inc_balance !== undefined) {
      getEvmWalletByProfileIdData.value.pending_incoming_balance = notification.data.fields.inc_balance;
    }
    if (notification.data.fields?.out_balance !== undefined) {
      getEvmWalletByProfileIdData.value.pending_outcoming_balance = notification.data.fields.out_balance;
    }
    if (notification.data?.fields?.status) {
      usersStore.updateDataInProfile('wallet', {
        id: notification.data.fields.object_id, status: notification.data.fields.status,
      });
    }
    nextTick(() => {
      updateData();
    });
  };

  const resetAll = () => {
    getEvmWalletByProfileIdData.value = {};
  };

  return {
    evmWalletId,
    getEvmFormattedProfileWalletData,
    resetAll,
    // balance
    evmCurrentBalance,
    evmBalances,
    isEvmCurrentBalanceZero,
    isEvmTotalBalanceZero,
    evmPendingIncomingBalance,
    evmTotalBalance,
    evmPendingOutcomingBalance,
    isEvmCanWithdraw,
    evmWalletAddress,
    updateData,
    isEvmWalletStatusCreated,
    isEvmWalletStatusVerified,
    isEvmWalletStatusError,
    isEvmWalletStatusErrorRetry,
    isEvmWalletStatusErrorDocument,
    isEvmWalletStatusErrorPending,
    isEvmWalletStatusErrorSuspended,
    isEvmWalletStatusAnyError,
    updateNotificationData,
    getEvmWalletByProfileId,
    isGetEvmWalletByProfileIdLoading,
    getEvmWalletByProfileIdError,
    getEvmWalletByProfileIdData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileEvmWalletStore, import.meta.hot));
}
