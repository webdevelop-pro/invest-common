import { computed, type Ref } from 'vue';
import VTableEarnTransactionItem, { type IEarnTransaction } from '../components/VTableEarnTransactionItem.vue';

export interface StatItem {
  label: string;
  amount: number;
  valueInUsd: string;
}

export function useEarnYourPosition(
  stats: Ref<StatItem[]>,
  transactions: Ref<IEarnTransaction[]>,
  loading: Ref<boolean>
) {
  const balances = computed(() => stats.value.map((stat) => ({
    title: stat.label,
    balance: stat.valueInUsd,
  })));

  const tables = computed(() => [
    {
      title: 'Transactions:',
      header: [
        { text: 'Date' },
        { text: 'Transaction ID' },
        { text: 'Type' },
        { text: 'Status' },
        { text: 'Amount' },
      ],
      data: transactions.value,
      // Show skeleton whenever data is loading (including updates with existing data)
      loading: loading.value,
      rowLength: 5,
      colspan: 5,
      tableRowComponent: VTableEarnTransactionItem,
    },
  ]);

  return {
    balances,
    tables,
  };
}

