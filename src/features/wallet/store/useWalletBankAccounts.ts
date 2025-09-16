import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { loadPlaidScriptOnce, PlaidHandler } from 'InvestCommon/data/plaid/loadPlaidScriptOnce';

// Keep a single Plaid handler per module to prevent multiple callbacks firing
let plaidHandler: PlaidHandler | null = null;
let expectedLinkSessionId: string | null = null;

export function useWalletBankAccounts() {
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
      try {
        await loadPlaidScriptOnce();
        expectedLinkSessionId = null;
        // Create a fresh handler each time and replace the previous one
        const currentToken = createLinkTokenState.value.data?.link_token;
        plaidHandler = window?.Plaid.create({
          token: currentToken,
          onSuccess: async (publicToken: string, metadata: any) => {
            if (expectedLinkSessionId && metadata?.link_session_id !== expectedLinkSessionId) return;
            console.log('plaid success event', publicToken, metadata);
            await plaidOnLinkSuccess(publicToken);
            isLinkBankAccountLoading.value = false;
          },
          onLoad: () => {
            console.log('plaid on onload even');
          },
          onExit: (err: unknown, metadata: any) => {
            console.log('plaid on exit event', err, metadata);
            isLinkBankAccountLoading.value = false;
          },
          onEvent: (eventName: string, metadata: any) => {
            if (!expectedLinkSessionId && metadata?.link_session_id) {
              expectedLinkSessionId = metadata.link_session_id;
            }
            console.log('plaid on event', eventName, metadata);
          },
          receivedRedirectUri: null,
        });
        // Open only the latest created handler
        setTimeout(() => {
          if (plaidHandler) plaidHandler.open();
        }, 1000);
      } catch (e) {
        console.error(e);
        isLinkBankAccountLoading.value = false;
      }
    } else {
      isLinkBankAccountLoading.value = false;
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
}

