import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import type { IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';
import type { WalletFilterApplyPayload, WalletFilterItem } from './walletLogic.types';
import VTableWalletTokensItem from '../components/VTableWalletTokensItem.vue';

const INITIAL_VISIBLE = 20;
const LOAD_MORE_COUNT = 20;
const TABLE_ROW_LENGTH = 5;

const STABLECOIN_SYMBOLS = new Set([
  'USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'GUSD',
]);
const HOLDING_TYPE_RWA = 'RWA';
const HOLDING_TYPE_STABLE_COIN = 'Stable Coin';

const TABLE_HEADER = [
  { text: 'Token' },
  { text: 'Amount' },
  { text: 'Value', class: 'is--gt-tablet-show' },
  { text: 'Network Link', class: 'is--gt-tablet-show' },
];

function getHoldingType(balance: IEvmWalletBalances): string {
  const symbol = String(balance.symbol ?? '').toUpperCase();
  return STABLECOIN_SYMBOLS.has(symbol) ? HOLDING_TYPE_STABLE_COIN : HOLDING_TYPE_RWA;
}

export type { WalletFilterItem as WalletTokensFilterItem };

export function useWalletTokens() {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, isLoadingNotificationWallet } = storeToRefs(evmRepository);

  const tokensOptions = computed(() => getEvmWalletState.value.data?.balances ?? []);
  const holdingTypesFilter = ref<string[]>([]);

  const filterItems = computed<WalletFilterItem[]>(() => [
    {
      value: 'holdingType',
      title: 'By holding type:',
      options: [HOLDING_TYPE_RWA, HOLDING_TYPE_STABLE_COIN],
      model: [...holdingTypesFilter.value],
    },
  ]);

  const handleFilterApply: (items: WalletFilterApplyPayload[]) => void = (items) => {
    holdingTypesFilter.value = items.find((f) => f.value === 'holdingType')?.model ?? [];
  };

  const filteredTokensOptions = computed(() => {
    const selected = holdingTypesFilter.value;
    if (selected.length === 0) return tokensOptions.value;
    return tokensOptions.value.filter((b) => selected.includes(getHoldingType(b)));
  });

  const visibleCount = ref(INITIAL_VISIBLE);
  watch(holdingTypesFilter, () => { visibleCount.value = INITIAL_VISIBLE; }, { deep: true });

  const visibleTokens = computed(() =>
    filteredTokensOptions.value.slice(0, visibleCount.value),
  );
  const hasMoreTokens = computed(
    () => visibleCount.value < filteredTokensOptions.value.length,
  );
  const loadMoreTokens = () => {
    if (hasMoreTokens.value) visibleCount.value += LOAD_MORE_COUNT;
  };

  const isLoading = computed(
    () => getEvmWalletState.value.loading || isLoadingNotificationWallet.value,
  );

  const table = computed(() => [
    {
      title: 'Tokens:',
      header: TABLE_HEADER,
      data: visibleTokens.value,
      loading: isLoading.value,
      rowLength: TABLE_ROW_LENGTH,
      colspan: TABLE_HEADER.length,
      tableRowComponent: VTableWalletTokensItem,
      infiniteScroll: true,
      infiniteScrollDisabled: !hasMoreTokens.value || isLoading.value,
      onLoadMore: loadMoreTokens,
    },
  ]);

  return {
    table,
    tokensOptions,
    filteredTokensOptions,
    isLoading,
    filterItems,
    handleFilterApply,
  };
}
