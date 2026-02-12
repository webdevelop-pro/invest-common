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

const ADD_TRANSACTION_QUERY_KEY = 'add-transaction';

export const EVM_WALLET_TAB_INFO = {
  title: 'Crypto Wallet',
  text: 'View and manage your crypto assets.',
} as const;

const WALLET_TAB_QUERY_KEY = 'wallet-tab';
const VALID_WALLET_TABS = [HOLDINGS_TAB, TRANSACTIONS_TAB] as const;

function initialWalletTabFromRoute(query: Record<string, unknown>): string {
  const raw = query[WALLET_TAB_QUERY_KEY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && VALID_WALLET_TABS.includes(value as typeof VALID_WALLET_TABS[number])
    ? value
    : HOLDINGS_TAB;
}

export function useDashboardWallet() {
  const route = useRoute();
  const activeTab = ref(initialWalletTabFromRoute(route.query as Record<string, unknown>));

  const isDialogTransactionOpen = ref(false);
  const transactionType = ref<EvmTransactionTypes>(EvmTransactionTypes.deposit);
  const transactionQueryFromUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get(ADD_TRANSACTION_QUERY_KEY) ?? undefined
      : undefined;

  if (
    typeof transactionQueryFromUrl === 'string' &&
    VALID_TRANSACTION_QUERY.includes(transactionQueryFromUrl as EvmTransactionTypes)
  ) {
    transactionType.value = transactionQueryFromUrl as EvmTransactionTypes;
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
    crypto24hChange,
    rwaValueCoins,
    rwaValueMainFormatted,
    rwa24hChange,
    totalBalanceMainFormatted,
    totalBalanceCoins,
    isWalletDataLoading,
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
    buttonConfigs.value.filter((b) => ['earn', 'buy', 'bank-accounts'].includes(String(b.id))),
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
    const hasFiatPendingDeposit = fiatPendingDeposit.value != null;
    const hasCrypto24hChange = crypto24hChange.value != null;
    const hasRwa24hChange = rwa24hChange.value != null;
    return [
      {
        id: 'fiat',
        title: 'Fiat Balance:',
        value: fiatBalanceMainFormatted.value,
        unit: fiatBalanceCoins.value,
        secondaryText: hasFiatPendingDeposit ? 'Pending Deposit' : undefined,
        secondaryValue: hasFiatPendingDeposit ? `+ ${fiatPendingDeposit.value}` : undefined,
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
        secondaryText: hasCrypto24hChange ? '24h Change' : undefined,
        secondaryValue: hasCrypto24hChange ? crypto24hChange.value : undefined,
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
        value: rwaValueMainFormatted.value,
        unit: rwaValueCoins.value,
        secondaryText: hasRwa24hChange ? 'Value Change' : undefined,
        secondaryValue: hasRwa24hChange ? rwa24hChange.value : undefined,
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
    isWalletDataLoading,
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
