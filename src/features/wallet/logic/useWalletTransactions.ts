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
  { text: 'Type', class: 'is--gt-tablet-show' },
  { text: 'Type / ID', class: 'is--lt-tablet-show' },
  { text: 'ID Transaction', class: 'is--gt-tablet-show' },
  { text: 'Description', class: 'is--gt-tablet-show' },
  { text: 'Status', class: 'is--gt-tablet-show' },
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

function getCreatedAtTimestamp(row: WalletTransactionRow): number {
  const rawDate = row.created_at;
  if (!rawDate) return 0;
  const timestamp = Date.parse(rawDate);
  return Number.isFinite(timestamp) ? timestamp : 0;
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

  const lastFetchedWalletId = ref(0);

  watch(
    walletId,
    (id) => {
      const wId = Number(id ?? 0);
      if (wId <= 0) {
        lastFetchedWalletId.value = 0;
        return;
      }

      if (wId === lastFetchedWalletId.value && Array.isArray(getTransactionsState.value.data)) {
        return;
      }

      lastFetchedWalletId.value = wId;
      walletRepository.getTransactions(wId);
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
    const combined: Array<{ row: WalletTransactionRow; ts: number }> = [...evm, ...fiat].map((row) => ({
      row,
      ts: getCreatedAtTimestamp(row),
    }));
    combined.sort((a, b) => b.ts - a.ts);
    return combined.map((item) => item.row);
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
    const balanceFilter = balanceTypes.length ? new Set(balanceTypes) : null;
    const transactionFilter = transactionTypes.length ? new Set(transactionTypes) : null;
    return transactionsOptions.value.filter((row) => {
      if (balanceFilter) {
        const label = isFiatRow(row) ? 'Fiat' : 'Crypto';
        if (!balanceFilter.has(label)) return false;
      }
      if (transactionFilter) {
        const labels = getTransactionFilterLabels(row);
        if (!labels.some((l) => transactionFilter.has(l))) return false;
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
