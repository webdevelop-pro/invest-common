
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { IWalletDataResponse } from 'InvestCommon/types/api/wallet';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref, nextTick } from 'vue';
import { useProfileWalletBankAccountStore } from './useProfileWalletBankAccount';
import { fetchGetWalletData, fetchAddBankAccount } from 'InvestCommon/services/api/wallet';
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

export const useProfileWalletStore = defineStore('wallet', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileData } = storeToRefs(usersStore);
  const walletId = computed(() => selectedUserProfileData.value?.wallet.id || 0);

  const isGetProfileWalletDataLoading = ref(false);
  const isGetProfileWalletDatanError = ref(false);
  const getProfileWalletData = ref<IWalletDataResponse>({});

  const getProfileWallet = async () => {
    isGetProfileWalletDataLoading.value = true;
    const response = await fetchGetWalletData(walletId.value).catch((error: Response) => {
      isGetProfileWalletDatanError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getProfileWalletData.value = response;
    isGetProfileWalletDataLoading.value = false;
  };


  const isAddBankAccountLoading = ref(false);
  const isAddBankAccountError = ref(false);
  const addBankAccountData = ref();

  const setProfileWalletAddBankAccount = async () => {
    isAddBankAccountLoading.value = true;
    // eslint-disable-next-line
    const response = await fetchAddBankAccount(walletId.value).catch((error: Response) => {
      isAddBankAccountError.value = true;
      void generalErrorHandling(error);
    });
    // eslint-disable-next-line
    if (response) addBankAccountData.value = response;
    isAddBankAccountLoading.value = false;
  };

  // FORMATTED WALLET DATA
  const getFormattedProfileWalletData = computed(() => {
    const profileWalletBankAccountStore = useProfileWalletBankAccountStore();
    profileWalletBankAccountStore.$patch({ bankAccount: getProfileWalletData.value?.funding_source });
    const { bankAccountFormatted } = storeToRefs(profileWalletBankAccountStore);

    return {
      ...getProfileWalletData.value,
      funding_source: bankAccountFormatted.value,
    };
  });

  // WALLET STATUS
  const isWalletStatusCreated = computed(() => (
    getProfileWalletData.value?.status === STATUS_CREATED
  ));
  const isWalletStatusVerified = computed(() => (
    getProfileWalletData.value?.status === STATUS_VERIFIED
  ));
  const isWalletStatusError = computed(() => (
    getProfileWalletData.value?.status === STATUS_ERROR
  ));
  const isWalletStatusErrorRetry = computed(() => (
    getProfileWalletData.value?.status === STATUS_ERROR_RETRY
  ));
  const isWalletStatusErrorDocument = computed(() => (
    getProfileWalletData.value?.status === STATUS_ERROR_DOCUMENT
  ));
  const isWalletStatusErrorPending = computed(() => (
    getProfileWalletData.value?.status === STATUS_ERROR_PENDING
  ));
  const isWalletStatusErrorSuspended = computed(() => (
    getProfileWalletData.value?.status === STATUS_ERROR_SUSPENDED
  ));
  const isWalletStatusAnyError = computed(() => (
    isWalletStatusError.value || isWalletStatusErrorRetry.value || isWalletStatusErrorDocument.value
    || isWalletStatusErrorPending.value || isWalletStatusErrorSuspended.value
  ));

  // BANK ACCOUNT
  const isSomeLinkedBankAccount = computed(() => Boolean(getProfileWalletData.value?.funding_source));
  const linkedBankAccountName = computed(() => getProfileWalletData.value?.funding_source?.name || '');
  const linkedBankAccountBankName = computed(() => getProfileWalletData.value?.funding_source?.bank_name || '');
  const isCanAddBankAccount = computed(() => ((walletId.value !== null) && (walletId.value > 0)
    && (selectedUserProfileData.value?.kyc_status === 'approved') && !isWalletStatusAnyError.value));
  const isCanLoadFunds = computed(() => (isSomeLinkedBankAccount.value && !isWalletStatusAnyError.value));

  const deleteLinkedBankAccount = () => {
  };

  const addLinkedBankAccount = () => {
  };

  // BALANCE
  const currentBalance = computed(() => getProfileWalletData.value?.balance || 0);
  const pendingIncomingBalance = computed(() => getProfileWalletData.value?.pending_incoming_balance || 0);
  const pendingOutcomingBalance = computed(() => getProfileWalletData.value?.pending_outcoming_balance || 0);
  const isCurrentBalanceZero = computed(() => (currentBalance.value === 0));
  const totalBalance = computed(() => (
    currentBalance.value + pendingIncomingBalance.value - pendingOutcomingBalance.value));
  const isTotalBalanceZero = computed(() => (totalBalance.value === 0));

  const isCanWithdraw = computed(() => isSomeLinkedBankAccount.value && !isCurrentBalanceZero.value);

  const updateData = () => {
    if (!isGetProfileWalletDataLoading.value) {
      void getProfileWallet();
    }
  };

  const updateNotificationData = (notification: INotification) => {
    if (notification.data.fields?.balance) getProfileWalletData.value.balance = notification.data.fields?.balance;
    if (notification.data.fields?.inc_balance !== undefined) {
      getProfileWalletData.value.pending_incoming_balance = notification.data.fields.inc_balance;
    }
    if (notification.data.fields?.out_balance !== undefined) {
      getProfileWalletData.value.pending_outcoming_balance = notification.data.fields.out_balance;
    }
    if (notification.data?.fields?.status) {
      usersStore.updateDataInProfile('wallet', {
        id: notification.data.fields.object_id, status: notification.data.fields.status,
      });
    }
    void nextTick(() => {
      void updateData();
    });
  };

  const resetAll = () => {
    getProfileWalletData.value = {};
    addBankAccountData.value = undefined;
  };

  return {
    isGetProfileWalletDataLoading,
    getProfileWalletData,
    isGetProfileWalletDatanError,
    getProfileWallet,
    getFormattedProfileWalletData,
    setProfileWalletAddBankAccount,
    isAddBankAccountLoading,
    isAddBankAccountError,
    addBankAccountData,
    resetAll,
    // bank account
    isSomeLinkedBankAccount,
    linkedBankAccountName,
    linkedBankAccountBankName,
    isCanAddBankAccount,
    isCanWithdraw,
    deleteLinkedBankAccount,
    addLinkedBankAccount,
    // balance
    currentBalance,
    isCurrentBalanceZero,
    isTotalBalanceZero,
    isCanLoadFunds,
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileWalletStore, import.meta.hot));
}
