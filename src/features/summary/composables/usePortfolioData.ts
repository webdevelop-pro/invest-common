import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardPortfolioStore } from 'InvestCommon/features/investment/store/useDashboardPortfolio';

export interface DonutDatum {
  name: string;
  percent: number;
}

export interface SideInfoItem {
  label: string;
  amount?: number;
  percent?: number;
  color?: string;
}

const DEFAULT_CHART_COLORS = [
  '#004FFF',
  '#3DDC97',
  '#FF7070',
  '#6F3DFD',
  '#FFC24D',
  '#0042D4',
  '#36BE83',
  '#FF3B3B',
];

export function usePortfolioData() {
  const portfolioStore = useDashboardPortfolioStore();
  const { portfolioData, getInvestmentsState } = storeToRefs(portfolioStore);

  const isLoading = computed(() => getInvestmentsState.value?.loading);
  const portfolioSummary = computed(() => {
    let totalAmount = 0;
    const offerAmounts = new Map<string, number>();
    const categoryAmounts = new Map<string, number>();
    const topOffers = new Map<number, Record<string, unknown> & { investedAmount: number }>();

    for (const investment of portfolioData.value) {
      const amount = investment.amount || 0;
      totalAmount += amount;

      const offerName = investment.offer?.name || 'Unknown';
      offerAmounts.set(offerName, (offerAmounts.get(offerName) || 0) + amount);

      const securityType = investment.offer?.security_type || 'Unknown';
      categoryAmounts.set(securityType, (categoryAmounts.get(securityType) || 0) + amount);

      if (investment.offer && amount && investment.offer.status === 'published') {
        const offerId = investment.offer.id;
        const current = topOffers.get(offerId);
        if (current) {
          current.investedAmount += amount;
        } else {
          topOffers.set(offerId, {
            ...investment.offer,
            investedAmount: amount,
          });
        }
      }
    }

    const denominator = totalAmount || 1;
    const toSlices = (source: Map<string, number>) => Array.from(source.entries())
      .map(([label, amount]) => ({
        key: label,
        label,
        amount,
        percent: (amount / denominator) * 100,
      }))
      .sort((a, b) => b.percent - a.percent);

    return {
      totalAmount,
      offerSlices: toSlices(offerAmounts),
      categorySlices: toSlices(categoryAmounts),
      topInvestedOffers: Array.from(topOffers.values())
        .sort((a, b) => (b.investedAmount || 0) - (a.investedAmount || 0))
        .slice(0, 2),
    };
  });

  const totalAmount = computed(() => portfolioSummary.value.totalAmount);
  const offerSlices = computed(() => portfolioSummary.value.offerSlices);
  const categorySlices = computed(() => portfolioSummary.value.categorySlices);

  const offerDonutData = computed<DonutDatum[]>(() => 
    offerSlices.value.map((s) => ({ name: s.label, percent: s.percent }))
  );

  const categoryDonutData = computed<DonutDatum[]>(() => 
    categorySlices.value.map((s) => ({ name: s.label, percent: s.percent }))
  );

  const offerColors = computed(() => 
    DEFAULT_CHART_COLORS.slice(0, offerDonutData.value.length)
  );

  const categoryColors = computed(() => 
    DEFAULT_CHART_COLORS.slice(0, categoryDonutData.value.length)
  );

  const topInvestedOffers = computed(() => portfolioSummary.value.topInvestedOffers);


  return {
    portfolioData,
    getInvestmentsState,
    totalAmount,
    isLoading,
    offerSlices,
    offerDonutData,
    offerColors,
    categorySlices,
    categoryDonutData,
    categoryColors,
    topInvestedOffers,
  };
}
