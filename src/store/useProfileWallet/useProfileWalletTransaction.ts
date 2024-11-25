
import {
  ITransactionDataResponse, WalletAddTransactionTypes, WalletTransactionStatusTypes,
} from 'InvestCommon/types/api/wallet';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import {
  fetchGetTransactionsData, fetchAddTransaction, fetchCancelTransaction,
} from 'InvestCommon/services/api/wallet';
import { useProfileWalletBankAccountStore } from './useProfileWalletBankAccount';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { INotification } from 'InvestCommon/types/api/notifications';
import { useUsersStore } from '../useUsers';

// profile wallet transaction handling

export const useProfileWalletTransactionStore = defineStore('walletTransaction', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileData } = storeToRefs(usersStore);
  const walletId = computed(() => selectedUserProfileData.value?.wallet.id || 0);

  const isGetProfileWalletTransactionsDataLoading = ref(false);
  const isGetProfileWalletTransactionsDatanError = ref(false);
  const getProfileByIdWalletTransactionsData = ref<ITransactionDataResponse[]>([]);
  const getProfileByIdWalletTransactions = async () => {
    isGetProfileWalletTransactionsDataLoading.value = true;
    const response = await fetchGetTransactionsData(walletId.value).catch((error: Response) => {
      isGetProfileWalletTransactionsDatanError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getProfileByIdWalletTransactionsData.value = response.items;
    isGetProfileWalletTransactionsDataLoading.value = false;
  };

  const isSetProfileWalletAddTransactionLoading = ref(false);
  const isSetProfileWalletAddTransactionError = ref(false);
  const setProfileWalletAddTransactionData = ref();
  const setProfileWalletAddTransactionErrorData = ref();
  const setProfileWalletAddTransaction = async (type: WalletAddTransactionTypes, amount: number) => {
    isSetProfileWalletAddTransactionLoading.value = true;
    // eslint-disable-next-line
    const response = await fetchAddTransaction(walletId.value, type, amount).catch(async (error: Response) => {
      isSetProfileWalletAddTransactionError.value = true;
      setProfileWalletAddTransactionErrorData.value = JSON.parse(await error.text());
      void generalErrorHandling(error);
    });
    // eslint-disable-next-line
    if (response) setProfileWalletAddTransactionData.value = response.items;
    isSetProfileWalletAddTransactionLoading.value = false;
  };

  const isSetProfileWalletCancelTransactionLoading = ref(false);
  const isSetProfileWalletCancelTransactionError = ref(false);
  const setProfileWalletCancelTransactionData = ref();
  const isSetProfileWalletCancelTransactionLoadingId = ref(0);
  const setProfileWalletCancelTransaction = async (transaction_id: number) => {
    isSetProfileWalletCancelTransactionLoading.value = true;
    isSetProfileWalletCancelTransactionLoadingId.value = transaction_id;
    // eslint-disable-next-line
    const response = await fetchCancelTransaction(walletId.value, transaction_id).catch((error: Response) => {
      isSetProfileWalletCancelTransactionError.value = true;
      void generalErrorHandling(error);
    });
    // eslint-disable-next-line
    if (response) setProfileWalletCancelTransactionData.value = response.items;
    isSetProfileWalletCancelTransactionLoading.value = false;
    isSetProfileWalletCancelTransactionLoadingId.value = 0;
  };

  // FORMAT transaction
  const isStatusPending = (item: ITransactionDataResponse) => (
    item?.status === WalletTransactionStatusTypes.pending
  );
  const isStatusProcessed = (item: ITransactionDataResponse) => (
    item?.status === WalletTransactionStatusTypes.processed
  );
  const isStatusFailed = (item: ITransactionDataResponse) => (
    item?.status === WalletTransactionStatusTypes.failed
  );
  const isStatuscancelled = (item: ITransactionDataResponse) => (
    item?.status === WalletTransactionStatusTypes.cancelled
  );
  const isTypeDeposit = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.deposit
  );
  const isTypeWithdraw = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.withdrawal
  );
  const isTypeInvestment = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.investment
  );
  const isTypeDistribution = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.distribution
  );
  const isTypeFee = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.fee
  );
  const isTypeSale = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.sale
  );
  const isTypeReturn = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.return
  );
  const isTypeMarket = (item: ITransactionDataResponse) => (
    item?.type === WalletAddTransactionTypes.market
  );
  const sourceFormatted = (item: ITransactionDataResponse) => {
    const profileWalletBankAccountStore = useProfileWalletBankAccountStore();
    profileWalletBankAccountStore.$patch({ bankAccount: item?.source });
    const { bankAccountFormatted } = storeToRefs(profileWalletBankAccountStore);
    return bankAccountFormatted.value;
  };
  const destFormatted = (item: ITransactionDataResponse) => {
    const profileWalletBankAccountStore = useProfileWalletBankAccountStore();
    profileWalletBankAccountStore.$patch({ bankAccount: item?.dest });
    const { bankAccountFormatted } = storeToRefs(profileWalletBankAccountStore);
    return bankAccountFormatted.value;
  };

  const getTimeFormat = (fullDate: string) => {
    const date = new Date(fullDate);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const transactionFormatted = (item: ITransactionDataResponse) => ({
    ...item,
    amount: { value: item?.amount, currency: 'USD' },
    source: sourceFormatted(item),
    dest: destFormatted(item),
    submited_at_date: formatToFullDate(new Date(item?.submited_at || '').toISOString()),
    submited_at_time: getTimeFormat(item?.submited_at),
    updated_at_date: formatToFullDate(new Date(item?.updated_at || '').toISOString()),
    updated_at_time: getTimeFormat(item?.updated_at),
    isStatusPending: isStatusPending(item),
    isStatusProcessed: isStatusProcessed(item),
    isStatusFailed: isStatusFailed(item),
    isStatuscancelled: isStatuscancelled(item),
    isTypeDeposit: isTypeDeposit(item),
    isTypeWithdraw: isTypeWithdraw(item),
    isTypeInvestment: isTypeInvestment(item),
    isTypeDistribution: isTypeDistribution(item),
    isTypeFee: isTypeFee(item),
    isTypeSale: isTypeSale(item),
    isTypeReturn: isTypeReturn(item),
    isTypeMarket: isTypeMarket(item),
  });

  // FORMATTED TRANSACTIONS DATA
  const getFormattedProfileWalletTransactionsData = computed(() => {
    const formattedDataInner = getProfileByIdWalletTransactionsData.value?.map(
      (item: ITransactionDataResponse) => transactionFormatted(item),
    );
    return formattedDataInner;
  });


  // TRANSACTIONS
  const transactionsCount = computed(() => getFormattedProfileWalletTransactionsData.value?.length || 0);
  const pendingTransactions = computed(() => (
    getFormattedProfileWalletTransactionsData.value?.filter((item) => item.isStatusPending) || []
  ));
  const pendingTransactionsCount = computed(() => pendingTransactions.value?.length || 0);
  const completedTransactions = computed(() => (
    getFormattedProfileWalletTransactionsData.value?.filter((item) => item.isStatusProcessed) || []
  ));
  const completedTransactionsCount = computed(() => completedTransactions.value?.length || 0);
  const failedTransactions = computed(() => (
    getFormattedProfileWalletTransactionsData.value?.filter((item) => item.isStatusFailed) || []
  ));
  const failedTransactionsCount = computed(() => failedTransactions.value?.length || 0);
  const cancelledTransactions = computed(() => (
    getFormattedProfileWalletTransactionsData.value?.filter((item) => item.isStatuscancelled) || []
  ));
  const cancelledTransactionsCount = computed(() => cancelledTransactions.value?.length || 0);

  const updateNotificationData = (notification: INotification) => {
    const transactionId = notification.data.fields.object_id;
    const transactionStatus = notification.data.fields.status;
    const findTransaction = getProfileByIdWalletTransactionsData.value.find((item) => item.id === transactionId);
    if (findTransaction?.status && transactionStatus) findTransaction.status = transactionStatus;
    void getProfileByIdWalletTransactions();
  };

  const resetAll = () => {
    getProfileByIdWalletTransactionsData.value = [];
    setProfileWalletAddTransactionData.value = undefined;
    setProfileWalletCancelTransactionData.value = undefined;
    setProfileWalletAddTransactionErrorData.value = undefined;
  };

  return {
    getProfileByIdWalletTransactions,
    isGetProfileWalletTransactionsDataLoading,
    isGetProfileWalletTransactionsDatanError,
    getProfileByIdWalletTransactionsData,
    getFormattedProfileWalletTransactionsData,
    transactionsCount,
    pendingTransactions,
    pendingTransactionsCount,
    completedTransactions,
    completedTransactionsCount,
    failedTransactions,
    failedTransactionsCount,
    cancelledTransactions,
    cancelledTransactionsCount,
    isSetProfileWalletAddTransactionLoading,
    isSetProfileWalletAddTransactionError,
    setProfileWalletAddTransactionData,
    setProfileWalletAddTransaction,
    isSetProfileWalletCancelTransactionLoading,
    isSetProfileWalletCancelTransactionLoadingId,
    isSetProfileWalletCancelTransactionError,
    setProfileWalletCancelTransactionData,
    setProfileWalletCancelTransaction,
    resetAll,
    setProfileWalletAddTransactionErrorData,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileWalletTransactionStore, import.meta.hot));
}
