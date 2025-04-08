import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { IWalletDataResponse } from 'InvestCommon/types/api/wallet';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { computed, ref, nextTick } from 'vue';
import {
  fetchGetWalletData, fetchGetWalletByProfile,
} from 'InvestCommon/services/api/wallet';
import { INotification } from 'InvestCommon/types/api/notifications';
import { useProfileWalletBankAccountStore } from './useProfileWalletBankAccount';
import { useUsersStore } from '../useUsers';
import { IEventMetadata, IPlaidHandler } from '../usePlaid';

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
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(usersStore);
  const profileWalletBankAccountStore = useProfileWalletBankAccountStore();
  const {
    getLinkTokenAddAccountData, getLinkTokenAddAccountError,
    linkTokenExchangeData, linkTokenExchangeError, linkTokenProcessError,
    islinkTokenExchangeLoading,
  } = storeToRefs(profileWalletBankAccountStore);

  const isGetProfileWalletDataLoading = ref(false);
  const isGetProfileWalletDatanError = ref(false);
  const getProfileByIdWalletData = ref<IWalletDataResponse>({});

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

  // check if can delete
  const getProfileByIdWallet = async () => {
    isGetProfileWalletDataLoading.value = true;
    const response = await fetchGetWalletData(walletId.value).catch((error: Response) => {
      isGetProfileWalletDatanError.value = true;
      generalErrorHandling(error);
    });
    if (response) getProfileByIdWalletData.value = response;
    isGetProfileWalletDataLoading.value = false;
  };

  // FORMATTED WALLET DATA
  const getFormattedProfileWalletData = computed(() => {
    profileWalletBankAccountStore.$patch({ bankAccount: getWalletByProfileIdData.value?.funding_source });
    const { bankAccountFormatted } = storeToRefs(profileWalletBankAccountStore);

    return {
      ...getWalletByProfileIdData.value,
      funding_source: bankAccountFormatted.value,
    };
  });

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

  const plaidOnLinkSuccess = async (publicToken: string) => {
    const promises = [] as unknown[];
    if (!linkTokenExchangeData.value?.access_token && !islinkTokenExchangeLoading.value) {
      await profileWalletBankAccountStore.linkTokenExchange(selectedUserProfileId.value, publicToken);
    }

    if (linkTokenExchangeData.value && !linkTokenExchangeError.value && !islinkTokenExchangeLoading.value) {
      linkTokenExchangeData.value?.accounts?.forEach((account) => {
        const body = JSON.stringify({
          access_token: linkTokenExchangeData.value?.access_token,
          account_id: account?.account_id,
          name: account?.name,
          last4: account?.mask,
        });
        promises.push(profileWalletBankAccountStore.linkTokenProcess(selectedUserProfileId.value, body));
      });
    }

    await Promise.all(promises);
    getWalletByProfileId(selectedUserProfileId.value);
  };

  // BANK ACCOUNT
  const isLinkBankAccountLoading = ref(false);
  const isAddBankAccountError = computed(() => (
    getLinkTokenAddAccountError.value || linkTokenExchangeError.value || linkTokenProcessError.value));
  const handleLinkBankAccount = async () => {
    isLinkBankAccountLoading.value = true;
    if (!getLinkTokenAddAccountData.value?.link_token) {
      await profileWalletBankAccountStore.getLinkTokenAddAccount(selectedUserProfileId.value);
    }

    if (!getLinkTokenAddAccountError.value && getLinkTokenAddAccountData.value?.link_token) {
      const plaidScript = document.createElement('script');
      plaidScript.setAttribute('src', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
      document.head.appendChild(plaidScript);
      plaidScript.onload = () => {
        const handler = window?.Plaid.create({
          token: getLinkTokenAddAccountData.value?.link_token,
          onSuccess: async (publicToken: string, metadata: unknown) => {
            console.log('plaid success event', publicToken, metadata);
            await plaidOnLinkSuccess(publicToken);
            isLinkBankAccountLoading.value = false;
          },
          onLoad: () => {
            console.log('plaid on onload even');
          },
          onExit: (err: unknown, metadata: unknown) => {
            console.log('plaid on exit event', err, metadata);
            isLinkBankAccountLoading.value = false;
          },
          onEvent: (eventName: string, metadata: IEventMetadata) => {
            console.log('plaid on event', eventName, metadata);
          },
          // required for OAuth; if not using OAuth, set to null or omit:
          receivedRedirectUri: null, // window.location.href,
        }) as IPlaidHandler;
        setTimeout(handler.open, 1000);
      };
    }
  };
  const isSomeLinkedBankAccount = computed(() => (getWalletByProfileIdData.value?.funding_source.length > 0));
  const fundingSource = computed(() => getWalletByProfileIdData.value?.funding_source || []);
  const isCanAddBankAccount = computed(() => ((walletId.value !== null) && (walletId.value > 0)
    && (selectedUserProfileData.value?.kyc_status === 'approved') && !isWalletStatusAnyError.value));
  const isCanLoadFunds = computed(() => (isSomeLinkedBankAccount.value && !isWalletStatusAnyError.value));

  const deleteLinkedBankAccount = () => {
  };

  const addLinkedBankAccount = () => {
  };

  // BALANCE
  const currentBalance = computed(() => getWalletByProfileIdData.value?.balance || 0);
  const pendingIncomingBalance = computed(() => getWalletByProfileIdData.value?.pending_incoming_balance || 0);
  const pendingOutcomingBalance = computed(() => getWalletByProfileIdData.value?.pending_outcoming_balance || 0);
  const isCurrentBalanceZero = computed(() => (currentBalance.value === 0));
  const totalBalance = computed(() => (
    currentBalance.value + pendingIncomingBalance.value - pendingOutcomingBalance.value));
  const isTotalBalanceZero = computed(() => (totalBalance.value === 0));

  const isCanWithdraw = computed(() => isSomeLinkedBankAccount.value && !isCurrentBalanceZero.value);

  const updateData = () => {
    if (!isGetProfileWalletDataLoading.value) {
      getProfileByIdWallet();
    }
  };

  const updateNotificationData = (notification: INotification) => {
    if (notification.data.fields?.balance) getWalletByProfileIdData.value.balance = notification.data.fields?.balance;
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

  const resetAll = () => {
    getWalletByProfileIdData.value = {};
  };

  return {
    walletId,
    isGetProfileWalletDataLoading,
    getProfileByIdWalletData,
    isGetProfileWalletDatanError,
    getProfileByIdWallet,
    getFormattedProfileWalletData,
    resetAll,
    // bank account
    isSomeLinkedBankAccount,
    fundingSource,
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
    getWalletByProfileId,
    isGetWalletByProfileIdLoading,
    getWalletByProfileIdError,
    getWalletByProfileIdData,
    handleLinkBankAccount,
    isLinkBankAccountLoading,
    isAddBankAccountError,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileWalletStore, import.meta.hot));
}
