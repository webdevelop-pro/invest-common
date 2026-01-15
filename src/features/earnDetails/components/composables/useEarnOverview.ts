import { computed } from 'vue';
import type { ChartOptions } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';

export interface OverviewSection {
  title: string;
  data: unknown[];
  options?: ChartOptions;
  loading?: boolean;
}

interface UseEarnOverviewProps {
  sections: OverviewSection[];
}

/**
 * Adapts the formatter's yFormatter signature to match VShadcnChartArea's expected signature
 */
function adaptYFormatter(
  formatter?: (tick: number | Date) => string,
): ((tick: number | Date, i: number, ticks: number[] | Date[]) => string) | undefined {
  if (!formatter) return undefined;
  return (tick: number | Date) => formatter(tick);
}

export function useEarnOverview(props: UseEarnOverviewProps) {
  const isEmpty = computed(() => props.sections.length === 0);

  const isChartSection = (section: OverviewSection): boolean => {
    return section.options !== undefined;
  };

  const getYFormatter = (section: OverviewSection) => {
    return adaptYFormatter(section.options?.yFormatter);
  };

  return {
    isEmpty,
    isChartSection,
    getYFormatter,
  };
}

