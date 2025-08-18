import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useOffersDetailsSide } from '../useOffersDetailsSide';

vi.mock('InvestCommon/data/filer/filer.formatter', () => ({
  FilerFormatter: {
    getFormattedInvestmentDocuments: vi.fn(() => [
      { id: 1, typeFormatted: 'Investment-Agreements', url: '/docs/sa.pdf' },
      { id: 2, typeFormatted: 'Financial-Documents', url: '/docs/fin.pdf' },
    ]),
  },
}));

const mockClipboard = { copy: vi.fn(), copied: ref(false) };

vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn(() => mockClipboard),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(() => ({
    getFilesState: ref({ data: {} }),
    getPublicFilesState: ref({ data: {} }),
  })),
}));

describe('useOffersDetailsSide', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('computes readOnlyInfo and investmentDocUrl', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      valuationFormatted: '$1,000,000',
      securityTypeFormatted: 'SAFE',
      closeAtFormatted: '01/01/2025',
      data: {
        apy: '8%',
        distribution_frequency: 'Monthly',
        investment_strategy: 'Growth',
        estimated_hold_period: '24 months',
      },
    } as any);

    const composable = useOffersDetailsSide(offerRef);

    expect(composable.filesFormatted.value.length).toBe(2);
    expect(composable.investmentDocUrl.value).toBe('/docs/sa.pdf');

    const info = composable.readOnlyInfo.value;
    expect(info[0].text).toBe('$10.00');
    expect(info[7].text).toBe('01/01/2025');
  });

  it('onShareClick copies window.location.href', () => {
    const offerRef = ref(undefined as any);
    const composable = useOffersDetailsSide(offerRef);
    const href = window.location.href;
    composable.onShareClick();
    expect(mockClipboard.copy).toHaveBeenCalledWith(href);
  });
});


