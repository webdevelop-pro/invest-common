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

  const totalAmount = computed(() => 
    portfolioData.value.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  );

  const isLoading = computed(() => getInvestmentsState.value?.loading);

  // Generic function to create slices by any field
  const createSlices = (getKey: (inv: any) => string) => {
    const map = new Map<string, number>();
    
    for (const inv of portfolioData.value) {
      const key = getKey(inv) || 'Unknown';
      const current = map.get(key) || 0;
      map.set(key, current + (inv.amount || 0));
    }
    
    const arr = Array.from(map.entries()).map(([key, amount]) => ({ 
      key, 
      label: key, 
      amount 
    }));
    
    const total = totalAmount.value || 1;
    return arr
      .map((s) => ({ ...s, percent: (s.amount / total) * 100 }))
      .sort((a, b) => b.percent - a.percent);
  };

  // Assets diversification (by offer name)
  const offerSlices = computed(() => 
    createSlices((inv) => inv.offer?.name)
  );

  // Investment categories (by security type)
  const categorySlices = computed(() => 
    createSlices((inv) => inv.offer?.security_type)
  );

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

  // Top invested offers (unique by offer ID)
  const topInvestedOffers = computed(() => {
    const offerMap = new Map();
    
    portfolioData.value
      .filter((inv: any) => inv.offer && inv.amount)
      .forEach((inv: any) => {
        const offerId = inv.offer.id;
        if (offerMap.has(offerId)) {
          offerMap.get(offerId).investedAmount += inv.amount || 0;
        } else {
          offerMap.set(offerId, {
            ...inv.offer,
            investedAmount: inv.amount || 0
          });
        }
      });
    
    return Array.from(offerMap.values())
      .sort((a: any, b: any) => (b.investedAmount || 0) - (a.investedAmount || 0))
      .slice(0, 2);
  });


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
