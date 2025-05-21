import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref, nextTick } from 'vue';
import { fetchGetWalletByProfile } from 'InvestCommon/services/api/evm';
import { INotification } from 'InvestCommon/types/api/notifications';
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
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(usersStore);

  const isGetWalletByProfileIdLoading = ref(false);
  const getWalletByProfileIdError = ref();
  const getWalletByProfileIdData = ref();
  const getWalletByProfileId = async (profileId: string) => {
    isGetWalletByProfileIdLoading.value = true;
    getWalletByProfileIdError.value = null;
    const response = await fetchGetWalletByProfile(profileId)
      .catch(async (error: Response) => {
        const errorJson = await error.json();
        getWalletByProfileIdError.value = errorJson;
      });
    if (response) getWalletByProfileIdData.value = response;
    isGetWalletByProfileIdLoading.value = false;
  };

  const walletId = computed(() => getWalletByProfileIdData.value?.id || 0);

  // FORMATTED WALLET DATA
  const getFormattedProfileWalletData = computed(() => ({
    ...getWalletByProfileIdData.value,
  }));

  // WALLET STATUS
  const isWalletStatusCreated = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_CREATED
  ));
  const isWalletStatusVerified = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_VERIFIED
  ));
  const isWalletStatusError = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_ERROR
  ));
  const isWalletStatusErrorRetry = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_ERROR_RETRY
  ));
  const isWalletStatusErrorDocument = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_ERROR_DOCUMENT
  ));
  const isWalletStatusErrorPending = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_ERROR_PENDING
  ));
  const isWalletStatusErrorSuspended = computed(() => (
    getWalletByProfileIdData.value?.status === STATUS_ERROR_SUSPENDED
  ));
  const isWalletStatusAnyError = computed(() => (
    isWalletStatusError.value || isWalletStatusErrorRetry.value || isWalletStatusErrorDocument.value
    || isWalletStatusErrorPending.value || isWalletStatusErrorSuspended.value
  ));

  // BALANCE
  const currentBalance = computed(() => Number(getWalletByProfileIdData.value?.balance) * 0.10 || 0);
  const balances = computed(() => getWalletByProfileIdData.value?.balances || [{ TokenA: '50007' }, { TokenB: '5107' }]);
  const pendingIncomingBalance = computed(() => getWalletByProfileIdData.value?.pending_incoming_balance || 0);
  const pendingOutcomingBalance = computed(() => getWalletByProfileIdData.value?.pending_outcoming_balance || 0);
  const isCurrentBalanceZero = computed(() => (currentBalance.value === 0));
  const totalBalance = computed(() => (
    currentBalance.value + pendingIncomingBalance.value - pendingOutcomingBalance.value));
  const isTotalBalanceZero = computed(() => (totalBalance.value === 0));

  const isCanWithdraw = computed(() => !isCurrentBalanceZero.value);

  const updateData = () => {
    if (!isGetWalletByProfileIdLoading.value) {
      getWalletByProfileId(selectedUserProfileId.value);
    }
  };

  const updateNotificationData = (notification: INotification) => {
    if (notification.data.fields?.balance) getWalletByProfileIdData.value.balance = notification.data.fields?.balance;
    if (notification.data.fields?.balances) getWalletByProfileIdData.value.balances = notification.data.fields?.balances;
    if (notification.data.fields?.inc_balance !== undefined) {
      getWalletByProfileIdData.value.pending_incoming_balance = notification.data.fields.inc_balance;
    }
    if (notification.data.fields?.out_balance !== undefined) {
      getWalletByProfileIdData.value.pending_outcoming_balance = notification.data.fields.out_balance;
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

  const isDeleteAccountLoading = ref(false);
  const handleDeleteAccount = () => {

  };

  const resetAll = () => {
    getWalletByProfileIdData.value = {};
  };

  return {
    walletId,
    getFormattedProfileWalletData,
    resetAll,
    // balance
    currentBalance,
    balances,
    isCurrentBalanceZero,
    isTotalBalanceZero,
    pendingIncomingBalance,
    totalBalance,
    pendingOutcomingBalance,
    updateData,
    isWalletStatusCreated,
    isWalletStatusVerified,
    isWalletStatusError,
    isWalletStatusErrorRetry,
    isWalletStatusErrorDocument,
    isWalletStatusErrorPending,
    isWalletStatusErrorSuspended,
    isWalletStatusAnyError,
    updateNotificationData,
    getWalletByProfileId,
    isGetWalletByProfileIdLoading,
    getWalletByProfileIdError,
    getWalletByProfileIdData,
    handleDeleteAccount,
    isDeleteAccountLoading,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileEvmWalletStore, import.meta.hot));
}
