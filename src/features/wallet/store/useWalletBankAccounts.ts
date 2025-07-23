import { ref, computed } from 'vue';
import { defineStore, storeToRefs, acceptHMRUpdate } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';

export const useWalletBankAccounts = defineStore('useWalletBankAccounts', () => {
  // State
  const selectedProfileData = ref<object | null>(null);
  const loggedIn = ref<boolean>(false);

  // Stores
  const walletRepository = useRepositoryWallet();
  const {
    getWalletState, deleteLinkedAccountState, walletId, createLinkExchangeState,
    createLinkTokenState,
  } = storeToRefs(walletRepository);

  const fundingSource = computed(() => getWalletState.value.data?.funding_source || []);

  const isWalletAnyError = computed(() => (
    getWalletState.value.data?.isWalletStatusAnyError || getWalletState.value.error));
  const isCanAddBankAccount = computed(() => ((walletId.value !== null) && (walletId.value > 0)
    && (selectedProfileData.value?.kyc_status === 'approved') && !isWalletAnyError.value
    && !getWalletState.value.data?.isWalletStatusCreated));
  // Computed
  const isSkeleton = computed(() => getWalletState.value.loading || !fundingSource.value);
  const isLinkBankAccountLoading = ref(false);
  const profileId = computed(() => selectedProfileData.value?.id);

  // Actions

  const onDeleteAccountClick = async (sourceId: string | number) => {
    if (deleteLinkedAccountState.value.loading) return;
    if (profileId.value > 0) {
      await walletRepository.deleteLinkedAccount(
        profileId.value,
        {
          funding_source_id: String(sourceId),
        },
      );
    }
    if (profileId.value > 0) {
      walletRepository.getWalletByProfile(profileId.value);
    }
  };

  // Setup function to set profileId and loggedIn
  const setProfileContext = (profileData: object, isLoggedIn: boolean) => {
    selectedProfileData.value = profileData;
    loggedIn.value = isLoggedIn;
  };

  const plaidOnLinkSuccess = async (publicToken: string) => {
    const promises = [] as unknown[];
    if (!createLinkExchangeState.value.loading) {
      await walletRepository.createLinkExchange(profileId.value, { public_token: publicToken });
    }

    if (!createLinkExchangeState.value.error && !createLinkExchangeState.value.loading) {
      createLinkExchangeState.value.data?.accounts?.forEach((account) => {
        const body = {
          access_token: createLinkExchangeState.value.data?.access_token,
          account_id: account?.account_id,
          name: account?.name,
          last4: account?.mask,
        };
        promises.push(walletRepository.createLinkProcess(profileId.value, body));
      });
    }

    await Promise.all(promises);
    walletRepository.getWalletByProfile(profileId.value);
  };
  const handleLinkBankAccount = async () => {
    isLinkBankAccountLoading.value = true;
    if (!createLinkTokenState.value.data?.link_token) {
      await walletRepository.createLinkToken(profileId.value);
    }

    if (!createLinkTokenState.value.error && createLinkTokenState.value.data?.link_token) {
      const plaidScript = document.createElement('script');
      plaidScript.setAttribute('src', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
      document.head.appendChild(plaidScript);
      plaidScript.onload = () => {
        const handler = window?.Plaid.create({
          token: createLinkTokenState.value.data?.link_token,
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
          onEvent: (eventName: string, metadata: unknown) => {
            console.log('plaid on event', eventName, metadata);
          },
          // required for OAuth; if not using OAuth, set to null or omit:
          receivedRedirectUri: null, // window.location.href,
        });
        setTimeout(handler.open, 1000);
      };
    }
  };

  const onAddAccountClick = async () => {
    handleLinkBankAccount();
  };

  return {
    // Computed
    isSkeleton,
    fundingSource,
    isCanAddBankAccount,
    isLinkBankAccountLoading,
    deleteLinkedAccountState,
    // Actions
    onAddAccountClick,
    onDeleteAccountClick,
    setProfileContext,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletBankAccounts, import.meta.hot));
}
