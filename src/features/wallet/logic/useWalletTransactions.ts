import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type { IEvmTransactionDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import type { ITransactionDataFormatted } from 'InvestCommon/data/wallet/wallet.types';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import type { WalletFilterApplyPayload, WalletFilterItem } from './walletLogic.types';
import VTableWalletTransactionsItem from '../components/VTableWalletTransactionsItem.vue';

export type WalletTransactionRow = IEvmTransactionDataFormatted | ITransactionDataFormatted;

export interface WalletTransactionsFilterState {
  balanceTypes: string[];
  transactionTypes: string[];
}

const INITIAL_VISIBLE = 10;
const LOAD_MORE_COUNT = 10;
const TABLE_ROW_LENGTH = 5;

const TABLE_HEADER = [
  { text: 'Date' },
  { text: 'Type' },
  { text: 'ID Transaction' },
  { text: 'Description' },
  { text: 'Status' },
  { text: 'Amount' },
];

/** Maps transaction type (evm or wallet) to filter label. */
const TYPE_TO_FILTER_LABEL: Record<string, string> = {
  [EvmTransactionTypes.deposit]: 'Deposit',
  [EvmTransactionTypes.withdrawal]: 'Withdrawal',
  [EvmTransactionTypes.exchange]: 'Token Issuance',
  [WalletAddTransactionTypes.investment]: 'Investment',
  [WalletAddTransactionTypes.distribution]: 'Distribution',
};

function getTransactionFilterLabels(row: WalletTransactionRow): string[] {
  const type = (row as { type?: string }).type;
  const label = type ? TYPE_TO_FILTER_LABEL[type] : undefined;
  return label ? [label] : [];
}

function isFiatRow(row: WalletTransactionRow): boolean {
  return 'source_wallet_id' in row;
}

export type WalletTransactionsFilterItem = WalletFilterItem;

export function useWalletTransactions() {
  const walletRepository = useRepositoryWallet();
  const { getWalletState, getTransactionsState, walletId } = storeToRefs(walletRepository);
  const evmRepository = useRepositoryEvm();
  const {
    getEvmWalletState,
    isLoadingNotificationWallet,
    isLoadingNotificationTransaction,
  } = storeToRefs(evmRepository);

  watch(
    [walletId, () => getWalletState.value.data],
    ([id, wallet]) => {
      const wId = Number(id ?? 0);
      if (wId > 0 && wallet) walletRepository.getTransactions(wId);
    },
    { immediate: true },
  );

  const isLoading = computed(
    () =>
      getEvmWalletState.value.loading ||
      getWalletState.value.loading ||
      getTransactionsState.value.loading ||
      isLoadingNotificationWallet.value ||
      isLoadingNotificationTransaction.value,
  );

  const transactionsOptions = computed((): WalletTransactionRow[] => {
    const evm = getEvmWalletState.value.data?.formattedTransactions ?? [];
    const fiat = getTransactionsState.value.data ?? [];
    const combined: WalletTransactionRow[] = [...evm, ...fiat];
    return combined.sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });
  });

  const filters = ref<WalletTransactionsFilterState>({
    balanceTypes: [],
    transactionTypes: [],
  });

  const filterItems = computed<WalletFilterItem[]>(() => [
    {
      value: 'balanceType',
      title: 'By balance type:',
      options: ['Fiat', 'Crypto'],
      model: [...filters.value.balanceTypes],
    },
    {
      value: 'transactionType',
      title: 'By transaction type:',
      options: ['Deposit', 'Withdrawal', 'Investment', 'Token Issuance', 'Distribution'],
      model: [...filters.value.transactionTypes],
    },
  ]);

  const handleFilterApply = (items: WalletFilterApplyPayload[]) => {
    filters.value = {
      balanceTypes: items.find((f) => f.value === 'balanceType')?.model ?? [],
      transactionTypes: items.find((f) => f.value === 'transactionType')?.model ?? [],
    };
  };

  const filteredTransactions = computed<WalletTransactionRow[]>(() => {
    const { balanceTypes, transactionTypes } = filters.value;
    return transactionsOptions.value.filter((row) => {
      if (balanceTypes.length) {
        const label = isFiatRow(row) ? 'Fiat' : 'Crypto';
        if (!balanceTypes.includes(label)) return false;
      }
      if (transactionTypes.length) {
        const labels = getTransactionFilterLabels(row);
        if (!labels.some((l) => transactionTypes.includes(l))) return false;
      }
      return true;
    });
  });

  const visibleCount = ref(INITIAL_VISIBLE);
  watch(filters, () => { visibleCount.value = INITIAL_VISIBLE; }, { deep: true });

  const visibleTransactions = computed(() =>
    filteredTransactions.value.slice(0, visibleCount.value),
  );
  const hasMoreTransactions = computed(
    () => visibleCount.value < filteredTransactions.value.length,
  );
  const loadMoreTransactions = () => {
    if (hasMoreTransactions.value) visibleCount.value += LOAD_MORE_COUNT;
  };

  const table = computed(() => [
    {
      title: 'Latest Transactions:',
      viewAllHref: '#',
      header: TABLE_HEADER,
      data: visibleTransactions.value,
      loading: isLoading.value,
      rowLength: TABLE_ROW_LENGTH,
      colspan: TABLE_HEADER.length,
      tableRowComponent: VTableWalletTransactionsItem,
      infiniteScroll: true,
      infiniteScrollDisabled: !hasMoreTransactions.value || isLoading.value,
      onLoadMore: loadMoreTransactions,
    },
  ]);

  return {
    isLoading,
    table,
    transactionsOptions,
    filteredTransactions,
    filters,
    setFilters: (payload: WalletTransactionsFilterState) => {
      filters.value = {
        balanceTypes: [...payload.balanceTypes],
        transactionTypes: [...payload.transactionTypes],
      };
    },
    filterItems,
    handleFilterApply,
  };
}
