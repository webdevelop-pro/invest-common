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
    expect(info[0].title).toBe('Share Price:');
    expect(info[0].text).toBe('$10.00');
    const closeDateItem = info.find(item => item.title === 'Close Date:');
    expect(closeDateItem?.text).toBe('01/01/2025');
  });

  it('shows Funding Goal for debt security type', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      targetRaiseFormatted: '$500,000',
      isSecurityTypeDebt: true,
      securityTypeFormatted: 'Debt',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const fundingGoalItem = info.find(item => item.title === 'Funding Goal:');
    expect(fundingGoalItem).toBeDefined();
    expect(fundingGoalItem?.text).toBe('$500,000');
    expect(fundingGoalItem?.show).toBe(true);
  });

  it('shows Funding Goal for convertible note security type', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      targetRaiseFormatted: '$500,000',
      isSecurityTypeConvertibleNote: true,
      securityTypeFormatted: 'Convertible Note',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const fundingGoalItem = info.find(item => item.title === 'Funding Goal:');
    expect(fundingGoalItem).toBeDefined();
    expect(fundingGoalItem?.text).toBe('$500,000');
    expect(fundingGoalItem?.show).toBe(true);
  });

  it('shows Target Raise and Pre-money Valuation for equity security type', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      targetRaiseFormatted: '$1,000,000',
      preMoneyValuationFormatted: '$5,000,000',
      isSecurityTypeEquity: true,
      securityTypeFormatted: 'Equity',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const targetRaiseItem = info.find(item => item.title === 'Target Raise:');
    expect(targetRaiseItem).toBeDefined();
    expect(targetRaiseItem?.text).toBe('$1,000,000');
    expect(targetRaiseItem?.show).toBe(true);

    const preMoneyItem = info.find(item => item.title === 'Pre-money Valuation:');
    expect(preMoneyItem).toBeDefined();
    expect(preMoneyItem?.text).toBe('$5,000,000');
    expect(preMoneyItem?.show).toBe(true);
  });

  it('shows Target Raise and Pre-money Valuation for preferred equity security type', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      targetRaiseFormatted: '$1,000,000',
      preMoneyValuationFormatted: '$5,000,000',
      isSecurityTypePreferredEquity: true,
      securityTypeFormatted: 'Preferred Equity',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const targetRaiseItem = info.find(item => item.title === 'Target Raise:');
    expect(targetRaiseItem).toBeDefined();
    expect(targetRaiseItem?.text).toBe('$1,000,000');
    expect(targetRaiseItem?.show).toBe(true);

    const preMoneyItem = info.find(item => item.title === 'Pre-money Valuation:');
    expect(preMoneyItem).toBeDefined();
    expect(preMoneyItem?.text).toBe('$5,000,000');
    expect(preMoneyItem?.show).toBe(true);
  });

  it('hides Funding Goal when targetRaiseFormatted is not provided for debt', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      isSecurityTypeDebt: true,
      securityTypeFormatted: 'Debt',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const fundingGoalItem = info.find(item => item.title === 'Funding Goal:');
    expect(fundingGoalItem?.show).toBe(false);
  });

  it('hides Target Raise and Pre-money Valuation when not provided for equity', () => {
    const offerRef = ref({
      pricePerShareFormatted: '$10.00',
      isSecurityTypeEquity: true,
      securityTypeFormatted: 'Equity',
    } as any);

    const composable = useOffersDetailsSide(offerRef);
    const info = composable.readOnlyInfo.value;
    
    const targetRaiseItem = info.find(item => item.title === 'Target Raise:');
    expect(targetRaiseItem?.show).toBe(false);

    const preMoneyItem = info.find(item => item.title === 'Pre-money Valuation:');
    expect(preMoneyItem?.show).toBe(false);
  });

  it('onShareClick copies window.location.href', () => {
    const offerRef = ref(undefined as any);
    const composable = useOffersDetailsSide(offerRef);
    const href = window.location.href;
    composable.onShareClick();
    expect(mockClipboard.copy).toHaveBeenCalledWith(href);
  });
});


