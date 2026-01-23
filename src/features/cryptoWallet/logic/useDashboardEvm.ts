import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { useCryptoWalletAlert } from '../composables/useCryptoWalletAlert';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';

export const EVM_WALLET_TAB_INFO = {
  title: 'Crypto Wallet',
  text: `
    Modern, simple, user-friendly "hot wallet" for managing your REAL WORLD ASSETS. It allows you to not only send, receive, and store RWA tokens but also to beautifully display and manage your crypto portfolio. Its real power lies in its ability to connect to world assets and interact directly with other marketplaces, decentralized finance (DeFi) platforms for swapping tokens or earning yield. In essence, we simplifies the complex process DeFI and TradeFI into a clean interface, making it easy for anyone to securely navigate the decentralized web
  `,
};

export function useDashboardEvm() {
  const route = useRoute();

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);

  const {
    isAlertShow,
    isTopTextShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    onAlertButtonClick,
  } = useCryptoWalletAlert();

  const hasRestrictedWallet = computed(() => 
    hasRestrictedWalletBehavior((selectedUserProfileData.value ?? null) as IProfileFormatted | null)
  );

  const isWalletError = computed(() => getEvmWalletState.value.data?.isStatusAnyError || getEvmWalletState.value.error);

  const showWalletTable = computed(() => (
    !hasRestrictedWallet.value
    && !isWalletError.value
  ));

  const isDialogTransactionOpen = ref(false);
  const transactiontType = ref<EvmTransactionTypes>(EvmTransactionTypes.deposit);

  // Initialize transaction type from URL query before dialog parses it
  const initTransactionTypeFromQuery = () => {
    const queryVal = route.query['add-transaction'];
    const value = Array.isArray(queryVal) ? queryVal[0] : queryVal;
    if (
      value === EvmTransactionTypes.withdrawal
      || value === EvmTransactionTypes.deposit
      || value === EvmTransactionTypes.exchange
    ) {
      transactiontType.value = value as EvmTransactionTypes;
      isDialogTransactionOpen.value = true;
    }
  };

  initTransactionTypeFromQuery();

  const onTransactionClick = (type: EvmTransactionTypes) => {
    transactiontType.value = type;
    isDialogTransactionOpen.value = true;
  };

  return {
    // state from stores
    selectedUserProfileId,
    selectedUserProfileData,
    userLoggedIn,

    // repository state
    getEvmWalletState,

    // ui constants
    EVM_WALLET_TAB_INFO,

    // computed for UI
    isWalletError,
    isAlertShow,
    isTopTextShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    showWalletTable,

    // actions
    onAlertButtonClick,
    onTransactionClick,

    // dialog state
    isDialogTransactionOpen,
    transactiontType,
  };
}

export default useDashboardEvm;


