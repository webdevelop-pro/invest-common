import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

// Mock portfolio data
const mockPortfolioData = [
  {
    amount: 1000,
    offer: {
      id: 1,
      name: 'Offer A',
      security_type: 'Equity',
      status: 'published',
    },
  },
  {
    amount: 500,
    offer: {
      id: 2,
      name: 'Offer B',
      security_type: 'Debt',
      status: 'published',
    },
  },
  {
    amount: 1500,
    offer: {
      id: 1,
      name: 'Offer A',
      security_type: 'Equity',
      status: 'published',
    },
  },
];

// Mock the portfolio store
const mockGetInvestmentsState = ref({
  loading: false,
  error: null,
  data: { data: mockPortfolioData },
});

vi.mock('InvestCommon/features/investment/store/useDashboardPortfolio', () => ({
  useDashboardPortfolioStore: () => ({
    portfolioData: ref(mockPortfolioData),
    getInvestmentsState: mockGetInvestmentsState,
  }),
}));

import { usePortfolioData } from '../usePortfolioData';

describe('usePortfolioData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockGetInvestmentsState.value = {
      loading: false,
      error: null,
      data: { data: mockPortfolioData },
    };
  });

  it('computes portfolio data correctly', () => {
    const api = usePortfolioData();

    expect(api.totalAmount.value).toBe(3000);
    expect(api.isLoading.value).toBe(false);

    // Offer aggregation
    const offerSlice = api.offerSlices.value;
    expect(offerSlice[0].label).toBe('Offer A');
    expect(Math.round(offerSlice[0].percent)).toBe(83); // 2500/3000

    // Category aggregation
    const catSlice = api.categorySlices.value;
    const equity = catSlice.find((s) => s.label === 'Equity');
    expect(Math.round(equity!.percent)).toBe(83);

    // Donut data and colors
    expect(api.offerDonutData.value.length).toBe(2);
    expect(api.offerColors.value.length).toBe(2);
    expect(api.categoryDonutData.value.length).toBeGreaterThan(0);
    expect(api.categoryColors.value.length).toBe(api.categoryDonutData.value.length);

    // Top invested offers unique by offer id
    expect(api.topInvestedOffers.value.length).toBe(2);
    expect(api.topInvestedOffers.value[0].id).toBe(1);
    expect(api.topInvestedOffers.value[0].investedAmount).toBe(2500);
  });
});


