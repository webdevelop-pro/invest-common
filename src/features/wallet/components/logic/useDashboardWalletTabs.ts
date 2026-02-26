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
  loading?: boolean;
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

  const filterDisabledComputed = computed(() => {
    if (props.filterDisabled) return true;

    if (isHoldingsActive.value) {
      // Allow opening the filter even when the current holdings table
      // has zero rows (e.g. after applying a filter that matches nothing).
      // We only disable the filter completely when there is no table config.
      return !props.holdingsTable;
    }

    if (isTransactionsActive.value) {
      // Same behavior for the transactions tab: keep the filter enabled
      // as long as the table exists, regardless of the current row count.
      return !props.transactionsTable;
    }

    return false;
  });

  return {
    activeTabModel,
    filterDisabledComputed,
  };
}

