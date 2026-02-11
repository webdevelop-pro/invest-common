import { computed } from 'vue';
import type { DashboardWalletTableConfig, WalletFilterItem } from 'InvestCommon/features/wallet/logic/walletLogic.types';

export interface DashboardWalletTabsProps {
  activeTab: string;
  holdingsTab: string;
  transactionsTab: string;
  holdingsTable: DashboardWalletTableConfig | null;
  transactionsTable: DashboardWalletTableConfig | null;
  filterItems: WalletFilterItem[];
  filterDisabled?: boolean;
}

export type DashboardWalletTabsEmit = (e: 'update:activeTab', value: string) => void;

export function useDashboardWalletTabs(
  props: Readonly<DashboardWalletTabsProps>,
  emit: DashboardWalletTabsEmit,
) {
  const activeTabModel = computed({
    get: () => props.activeTab,
    set: (value: string) => emit('update:activeTab', value),
  });

  const isHoldingsActive = computed(
    () => activeTabModel.value === props.holdingsTab,
  );

  const isTransactionsActive = computed(
    () => activeTabModel.value === props.transactionsTab,
  );

  const hasHoldingsData = computed(
    () => !!props.holdingsTable && Array.isArray(props.holdingsTable.data) && props.holdingsTable.data.length > 0,
  );

  const hasTransactionsData = computed(
    () => !!props.transactionsTable && Array.isArray(props.transactionsTable.data) && props.transactionsTable.data.length > 0,
  );

  const filterDisabledComputed = computed(() => {
    if (props.filterDisabled) return true;

    if (isHoldingsActive.value) {
      return !hasHoldingsData.value;
    }

    if (isTransactionsActive.value) {
      return !hasTransactionsData.value;
    }

    return false;
  });

  return {
    activeTabModel,
    filterDisabledComputed,
  };
}

