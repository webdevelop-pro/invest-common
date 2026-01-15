import { computed } from 'vue';
import { type IEarnTransaction } from './useEarnTransactionItem';
import VTableEarnTransactionItem from '../VTableEarnTransactionItem.vue';

export interface StatItem {
  label: string;
  amount: number;
  valueInUsd: string;
}

interface TableHeader {
  text: string;
}

interface UseEarnYourPositionProps {
  stats?: StatItem[];
  transactions?: IEarnTransaction[];
  loading?: boolean;
}

const TABLE_HEADERS: TableHeader[] = [
  { text: 'Date' },
  { text: 'Transaction ID' },
  { text: 'Type' },
  { text: 'Status' },
  { text: 'Amount' },
];

const TABLE_COLSPAN = 5;
const TABLE_ROW_LENGTH = 5;

export function useEarnYourPosition(props: UseEarnYourPositionProps) {
  const balances = computed(() =>
    (props.stats ?? []).map((stat) => ({
      title: stat.label,
      balance: stat.valueInUsd,
    })),
  );

  const tables = computed(() => [
    {
      title: 'Transactions:',
      header: TABLE_HEADERS,
      data: props.transactions ?? [],
      // Show skeleton whenever data is loading (including updates with existing data)
      loading: props.loading ?? false,
      rowLength: TABLE_ROW_LENGTH,
      colspan: TABLE_COLSPAN,
      tableRowComponent: VTableEarnTransactionItem,
    },
  ]);

  return {
    balances,
    tables,
  };
}

