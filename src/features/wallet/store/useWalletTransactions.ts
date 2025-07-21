import { ref, computed, watch } from 'vue';
import { defineStore, storeToRefs, acceptHMRUpdate } from 'pinia';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';

export const useWalletTransactions = defineStore('useWalletTransactions', () => {
  // State
  const profileId = ref<number | null>(null);
  const loggedIn = ref<boolean>(false);

  // Stores
  const profileWalletStore = useProfileWalletStore();
  const {
    isCanWithdraw, isCanLoadFunds, currentBalance, pendingIncomingBalance,
    pendingOutcomingBalance, isGetWalletByProfileIdLoading, walletId,
  } = storeToRefs(profileWalletStore);
  const walletRepository = useRepositoryWallet();
  const { getTransactionsState } = storeToRefs(walletRepository);

  // Dialog state
  const isDialogAddTransactionOpen = ref(false);
  const addTransactiontTransactionType = ref(WalletAddTransactionTypes.deposit);

  // Computed
  const isShowIncomingBalance = computed(() => (pendingIncomingBalance.value > 0));
  const isShowOutgoingBalance = computed(() => (pendingOutcomingBalance.value > 0));
  const isLoading = ref(true);

  // Watch for notification changes to update loading state
  watch(() => [getTransactionsState.value.loading, isGetWalletByProfileIdLoading.value], () => {
    const loadingResult = getTransactionsState.value.loading || isGetWalletByProfileIdLoading.value;
    if (loadingResult) {
      isLoading.value = true;
    } else {
      setTimeout(() => {
        isLoading.value = false;
      }, 100);
    }
  });
  const isSkeleton = computed(() => isLoading.value && ((getTransactionsState.value.data || [])?.length < 1));

  // Actions
  const onWithdrawClick = () => {
    addTransactiontTransactionType.value = WalletAddTransactionTypes.withdrawal;
    isDialogAddTransactionOpen.value = true;
  };
  const onAddFundsClick = () => {
    addTransactiontTransactionType.value = WalletAddTransactionTypes.deposit;
    isDialogAddTransactionOpen.value = true;
  };

  // Setup function to set profileId and loggedIn
  const setProfileContext = (id: number, isLoggedIn: boolean) => {
    profileId.value = id;
    loggedIn.value = isLoggedIn;
  };

  // Watch for profileId and walletId changes to load transactions
  watch(() => [profileId.value, walletId.value], () => {
    if ((profileId.value && profileId.value > 0) && (walletId.value > 0)) {
      walletRepository.getTransactions(walletId.value);
    }
  }, { immediate: true });

  return {
    // State
    isDialogAddTransactionOpen,
    addTransactiontTransactionType,
    profileId,
    loggedIn,
    // Computed
    isShowIncomingBalance,
    isShowOutgoingBalance,
    isSkeleton,
    // Store refs
    isCanWithdraw,
    isCanLoadFunds,
    currentBalance,
    pendingIncomingBalance,
    pendingOutcomingBalance,
    getTransactionsState,
    // Actions
    onWithdrawClick,
    onAddFundsClick,
    setProfileContext,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletTransactions, import.meta.hot));
} 