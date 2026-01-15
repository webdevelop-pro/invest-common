import { computed } from 'vue';

export interface IEarnTransaction {
  id: number;
  date: string;
  time: string;
  amount: string;
  transaction_id: string;
  type: string;
  status: {
    text: string;
    tooltip: string;
  };
  tagColor: string;
}

export type BadgeColor = 'primary' | 'secondary' | 'secondary-light' | 'red' | 'yellow' | 'red-light' | 'yellow-light' | 'purple-light' | 'default';

interface UseEarnTransactionItemProps {
  data?: IEarnTransaction;
  loading?: boolean;
}

export function useEarnTransactionItem(props: UseEarnTransactionItemProps) {
  const formattedType = computed(() => {
    if (!props.data?.type) return '';
    const type = props.data.type;
    return type.charAt(0).toUpperCase() + type.slice(1);
  });

  const hasTransactionId = computed(() => Boolean(props.data?.transaction_id));

  const badgeColor = computed<BadgeColor | undefined>(() => {
    if (!props.data?.tagColor) return undefined;
    const color = props.data.tagColor.toLowerCase();
    // Map common color strings to badge colors
    if (color.includes('green')) return 'secondary-light';
    if (color.includes('red')) return 'red-light';
    if (color.includes('yellow')) return 'yellow-light';
    return 'default';
  });

  return {
    formattedType,
    hasTransactionId,
    badgeColor,
  };
}

