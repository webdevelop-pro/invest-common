import { IFundingSourceDataResponse } from 'InvestCommon/types/api/wallet';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  fetchCreateLinkToken, fetchCreateLinkExchange, fetchCreateLinkProcess, fetchDeleteLinkedAccount,
} from 'InvestCommon/services/api/wallet';
import { generalErrorHandling } from 'UiKit/helpers/api/generalErrorHandling';

const STATUS_PENDING = 'pending';
// profile wallet bank account handling

export const useProfileWalletBankAccountStore = defineStore('walletBankAccount', () => {
  const isGetLinkTokenAddAccountLoading = ref(false);
  const getLinkTokenAddAccountError = ref();
  const getLinkTokenAddAccountData = ref();
  const getLinkTokenAddAccount = async (profileId: number) => {
    isGetLinkTokenAddAccountLoading.value = true;
    getLinkTokenAddAccountData.value = null;
    getLinkTokenAddAccountError.value = null;
    const response = await fetchCreateLinkToken(profileId).catch((error: Response) => {
      getLinkTokenAddAccountError.value = error;
      generalErrorHandling(error);
    });
    if (response) getLinkTokenAddAccountData.value = response;
    isGetLinkTokenAddAccountLoading.value = false;
  };

  const islinkTokenExchangeLoading = ref(false);
  const linkTokenExchangeError = ref();
  const linkTokenExchangeData = ref();
  const linkTokenExchange = async (profileId: number, publicToken: string) => {
    islinkTokenExchangeLoading.value = true;
    linkTokenExchangeData.value = null;
    linkTokenExchangeError.value = null;
    const body = JSON.stringify({ public_token: publicToken });
    const response = await fetchCreateLinkExchange(profileId, body).catch((error: Response) => {
      linkTokenExchangeError.value = error;
      generalErrorHandling(error);
    });
    if (response) linkTokenExchangeData.value = response;
    islinkTokenExchangeLoading.value = false;
  };

  const islinkTokenProcessLoading = ref(false);
  const linkTokenProcessError = ref();
  const linkTokenProcessData = ref();
  const linkTokenProcess = async (profileId: number, body: string) => {
    islinkTokenProcessLoading.value = true;
    linkTokenProcessData.value = null;
    linkTokenProcessError.value = null;
    const response = await fetchCreateLinkProcess(profileId, body).catch((error: Response) => {
      linkTokenProcessError.value = error;
      generalErrorHandling(error);
    });
    if (response) linkTokenProcessData.value = response;
    islinkTokenProcessLoading.value = false;
  };

  const isDeleteAccountLoading = ref(false);
  const deleteAccountError = ref();
  const deleteAccountData = ref();
  const deleteAccount = async (profileId: number, body: string) => {
    isDeleteAccountLoading.value = true;
    deleteAccountData.value = null;
    deleteAccountError.value = null;
    const response = await fetchDeleteLinkedAccount(profileId, body).catch((error: Response) => {
      deleteAccountError.value = error;
      generalErrorHandling(error);
    });
    if (response) deleteAccountData.value = response;
    isDeleteAccountLoading.value = false;
  };

  const bankAccount = ref<IFundingSourceDataResponse>();

  // FORMAT transaction
  const isBankAccountStatusPending = computed(() => (
    bankAccount.value?.status === STATUS_PENDING
  ));

  const bankAccountFormatted = computed(() => ({
    ...bankAccount.value,
    isBankAccountStatusPending: isBankAccountStatusPending.value,
  }));

  const resetAll = () => {
    bankAccount.value = null;
    getLinkTokenAddAccountError.value = null;
    getLinkTokenAddAccountData.value = null;
    linkTokenExchangeError.value = null;
    linkTokenExchangeData.value = null;
    linkTokenProcessError.value = null;
    linkTokenProcessData.value = null;
  };

  return {
    resetAll,
    bankAccount,
    bankAccountFormatted,
    getLinkTokenAddAccount,
    isGetLinkTokenAddAccountLoading,
    getLinkTokenAddAccountError,
    getLinkTokenAddAccountData,
    linkTokenExchange,
    islinkTokenExchangeLoading,
    linkTokenExchangeError,
    linkTokenExchangeData,
    linkTokenProcess,
    islinkTokenProcessLoading,
    linkTokenProcessError,
    linkTokenProcessData,
    deleteAccount,
    isDeleteAccountLoading,
    deleteAccountError,
    deleteAccountData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileWalletBankAccountStore, import.meta.hot));
}
