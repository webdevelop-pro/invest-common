import { computed } from 'vue';
import type { RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';

interface UseEarnRiskProps {
  formattedRiskData: RiskSection[];
  loading: boolean;
}

export function useEarnRisk(props: UseEarnRiskProps) {
  const isEmpty = computed(() => !props.loading && props.formattedRiskData.length === 0);
  const hasData = computed(() => props.formattedRiskData.length > 0);

  return {
    isEmpty,
    hasData,
  };
}

