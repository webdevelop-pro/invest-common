import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useWalletData } from 'InvestCommon/features/summary/composables/useWalletData';
import { useWallet } from 'InvestCommon/features/wallet/logic/useWallet';
import { useWalletAlert } from 'InvestCommon/features/wallet/logic/useWalletAlert';
import { useWalletTokens } from 'InvestCommon/features/wallet/logic/useWalletTokens';
import { useWalletActions } from 'InvestCommon/features/wallet/logic/useWalletActions';
import { useWalletTransactions } from 'InvestCommon/features/wallet/logic/useWalletTransactions';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import type { WalletFilterApplyPayload } from './walletLogic.types';
import env from 'InvestCommon/domain/config/env';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { urlSettingsBankAccounts } from 'InvestCommon/domain/config/links';
import externalLink from 'UiKit/assets/images/external-link.svg';
import bank from 'UiKit/assets/images/bank.svg';

export const HOLDINGS_TAB = 'holdings';
export const TRANSACTIONS_TAB = 'transactions';

const VALID_TRANSACTION_QUERY = [
  EvmTransactionTypes.withdrawal,
  EvmTransactionTypes.deposit,
  EvmTransactionTypes.exchange,
];

export const EVM_WALLET_TAB_INFO = {
  title: 'Crypto Wallet',
  text: 'View and manage your crypto assets.',
} as const;

export function useDashboardWallet() {
  const route = useRoute();
  const activeTab = ref(HOLDINGS_TAB);

  const isDialogTransactionOpen = ref(false);
  const transactionType = ref<EvmTransactionTypes>(EvmTransactionTypes.deposit);
  const queryVal = route.query['add-transaction'];
  const queryType = (Array.isArray(queryVal) ? queryVal[0] : queryVal) as string | undefined;
  if (queryType && VALID_TRANSACTION_QUERY.includes(queryType as EvmTransactionTypes)) {
    transactionType.value = queryType as EvmTransactionTypes;
    isDialogTransactionOpen.value = true;
  }

  const onTransactionClick = (type: EvmTransactionTypes) => {
    transactionType.value = type;
    isDialogTransactionOpen.value = true;
  };

  const { getEvmWalletState: summaryEvmWalletState } = useWalletData();
  const {
    fiatBalanceCoins,
    fiatBalanceMainFormatted,
    fiatPendingDeposit,
    cryptoBalanceCoins,
    cryptoBalanceMainFormatted,
    rwaBalanceCoins,
    rwaBalanceMainFormatted,
    totalBalanceMainFormatted,
    totalBalanceCoins,
  } = useWallet();

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const { userLoggedIn } = storeToRefs(useSessionStore());

  const {
    isAlertShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    onAlertButtonClick,
    showTable,
    isTopTextShow,
  } = useWalletAlert();

  const dialogsStore = useDialogs();

  const {
    table: walletTokensTable,
    filterItems: holdingsFilterItems,
    handleFilterApply: handleHoldingsFiltersApply,
  } = useWalletTokens();

  const {
    buttonConfigs,
    handleButtonClick,
  } = useWalletActions({}, (event, type) => {
    if (event === 'click') onTransactionClick(type as EvmTransactionTypes);
  });

  const {
    table: walletTransactionsTable,
    filterItems: walletFilterItems,
    handleFilterApply: handleWalletFiltersApply,
  } = useWalletTransactions();

  const holdingsTable = computed(() => walletTokensTable.value?.[0] ?? null);
  const transactionsTable = computed(() => walletTransactionsTable.value?.[0] ?? null);

  const walletFilterItemsComputed = computed(() =>
    activeTab.value === HOLDINGS_TAB ? holdingsFilterItems.value : walletFilterItems.value,
  );

  const handleWalletFilterApply = (items: WalletFilterApplyPayload[]) => {
    if (activeTab.value === HOLDINGS_TAB) {
      handleHoldingsFiltersApply(items);
    } else {
      handleWalletFiltersApply(items);
    }
  };

  const primaryButtons = computed(() =>
    buttonConfigs.value.filter((b) =>
      ['add-funds', 'withdraw', 'exchange'].includes(String(b.id)),
    ),
  );
  const moreButtons = computed(() =>
    buttonConfigs.value.filter((b) => ['earn', 'buy'].includes(String(b.id))),
  );

  const handlePrimaryActionClick = (id: string | number, transactionType?: unknown) => {
    handleButtonClick({ id, transactionType });
  };

  const handleContactUsClick = (event: Event) => {
    const target = (event.target as HTMLElement)?.closest('[data-action="contact-us"]');
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      dialogsStore.openContactUsDialog('wallet');
    }
  };

  const scanUrl = env.CRYPTO_WALLET_SCAN_URL as string;
  const balanceCards = computed(() => {
    const walletAddress = summaryEvmWalletState.value.data?.address;
    const profileId = Number(selectedUserProfileId.value ?? 0);
    const bankAccountsHref = profileId ? urlSettingsBankAccounts(profileId) : undefined;
    return [
      {
        id: 'fiat',
        title: 'Fiat Balance:',
        value: fiatBalanceMainFormatted.value,
        unit: fiatBalanceCoins.value,
        secondaryText: fiatPendingDeposit.value ? 'Pending Deposit' : undefined,
        secondaryValue: fiatPendingDeposit.value ? `+ ${fiatPendingDeposit.value}` : undefined,
        action: {
          label: 'Your Bank Accounts',
          href: bankAccountsHref ?? '#',
          iconPre: bank as unknown as string,
        },
      },
      {
        id: 'crypto',
        title: 'Tradable Crypto Balance:',
        value: cryptoBalanceMainFormatted.value,
        unit: cryptoBalanceCoins.value,
        secondaryText: '24h Change',
        secondaryValue: '+$0.00 (0.00%)',
        action: {
          label: 'View on Etherscan',
          href: `${scanUrl}/address/${walletAddress}`,
          iconPost: externalLink as unknown as string,
          iconPostClass: 'dashboard-wallet--icon-external-link',
        },
      },
      {
        id: 'rwa',
        title: 'RWA Asset Balance:',
        value: rwaBalanceMainFormatted.value,
        unit: rwaBalanceCoins.value,
        secondaryText: 'Value Change',
        secondaryValue: '+$0.00 (0.00%)',
        action: {
          label: 'View on Etherscan',
          href: `${scanUrl}/address/${walletAddress}`,
          iconPost: externalLink as unknown as string,
          iconPostClass: 'dashboard-wallet--icon-external-link',
        },
      },
    ];
  });

  const filterDisabled = computed(
    () => !holdingsTable.value && !transactionsTable.value,
  );

  return {
    activeTab,
    summaryEvmWalletState,
    isAlertShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    onAlertButtonClick,
    handleContactUsClick,
    showTable,
    isTopTextShow,
    totalBalanceMainFormatted,
    totalBalanceCoins,
    primaryButtons,
    moreButtons,
    handlePrimaryActionClick,
    balanceCards,
    holdingsTable,
    transactionsTable,
    walletFilterItemsComputed,
    filterDisabled,
    handleWalletFilterApply,
    isDialogTransactionOpen,
    transactionType,
    onTransactionClick,
    selectedUserProfileId,
    userLoggedIn,
  };
}
