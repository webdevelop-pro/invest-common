import { computed } from 'vue';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

export interface InfoDataItem {
  text: string;
  value: string;
}

interface UseEarnTopInfoProps {
  poolData?: DefiLlamaYieldPoolFormatted;
  loading?: boolean;
  infoData?: InfoDataItem[];
}

// Default skeleton items to show when loading (matches formatTopInfoData structure)
const SKELETON_INFO_ITEMS: InfoDataItem[] = [
  { text: 'TVL:', value: '' },
  { text: 'APY:', value: '' },
  { text: 'Base APY:', value: '' },
  { text: 'Reward APY:', value: '' },
  { text: '30d Avg APY:', value: '' },
  { text: 'Type:', value: '' },
];

const DEFAULT_SYMBOL = 'USDC';

export function useEarnTopInfo(props: UseEarnTopInfoProps) {
  // Convert props to reactive refs to maintain reactivity
  // Use computed to safely access optional props with defaults
  const poolData = computed(() => props.poolData);
  const loading = computed(() => props.loading ?? false);
  const infoData = computed(() => props.infoData ?? []);

  const defaultSymbol = computed(() => poolData.value?.symbol || DEFAULT_SYMBOL);
  const hasPoolData = computed(() => Boolean(poolData.value));

  const displayInfoData = computed(() => {
    if (loading.value && infoData.value.length === 0) {
      return SKELETON_INFO_ITEMS;
    }
    return infoData.value;
  });

  return {
    defaultSymbol,
    hasPoolData,
    displayInfoData,
  };
}

