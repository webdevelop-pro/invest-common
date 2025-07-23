import { ref, computed, watch } from 'vue';
import { defineStore, storeToRefs, acceptHMRUpdate } from 'pinia';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';

export const useWalletTransactions = defineStore('useWalletTransactions', () => {
  // State
  const profileId = ref<number | null>(null);
  const loggedIn = ref<boolean>(false);

  // Stores
  const walletRepository = useRepositoryWallet();
  const { getTransactionsState, getWalletState, walletId } = storeToRefs(walletRepository);

  // Dialog state
  const isDialogAddTransactionOpen = ref(false);
  const addTransactiontTransactionType = ref(WalletAddTransactionTypes.deposit);
  const walletData = computed(() => getWalletState.value.data);

  // Computed
  const isShowIncomingBalance = computed(() => (
    (walletData.value?.pendingIncomingBalance ?? 0) > 0
  ));
  const isShowOutgoingBalance = computed(() => (
    (walletData.value?.pendingOutcomingBalance ?? 0) > 0
  ));
  const isLoading = ref(true);
  const isCanLoadFunds = computed(() => (walletData.value?.isSomeLinkedBankAccount && !walletData.value?.isWalletStatusAnyError));
  const isCanWithdraw = computed(() => walletData.value?.isSomeLinkedBankAccount && !walletData.value?.isCurrentBalanceZero);

  // Watch for notification changes to update loading state
  watch(() => [getTransactionsState.value.loading, getWalletState.value.loading], () => {
    const loadingResult = getTransactionsState.value.loading || getWalletState.value.loading;
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
    // Computed
    isShowIncomingBalance,
    isShowOutgoingBalance,
    isSkeleton,
    // Store refs
    walletData,
    isCanLoadFunds,
    isCanWithdraw,
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
