import { computed, onMounted } from 'vue';
import { useCryptoData } from './useCryptoData';
import { usePortfolioData } from './usePortfolioData';
import { useWalletData } from './useWalletData';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

// Re-export types for convenience
export type { SupportedCoinId } from './useCryptoData';
export type { DonutDatum, SideInfoItem } from './usePortfolioData';

export function useSummaryData() {
  const cryptoData = useCryptoData();
  const portfolioData = usePortfolioData();
  const walletData = useWalletData();
  const offerRepo = useRepositoryOffer();

  // Ensure offers are loaded for dependent computed values like topFundedOffer
  onMounted(() => {
    if (!offerRepo.getOffersState.data && !offerRepo.getOffersState.loading) {
      offerRepo.getOffers();
    }
  });

  // Top funded offer
  const topFundedOffer = computed(() => offerRepo.getTopOpenOffer());

  // Combined loading state
  const isLoading = computed(() => 
    cryptoData.getPricesState.value?.loading || 
    portfolioData.getInvestmentsState.value?.loading
  );

  // Formatters shared across charts
  const percentValueFormatter = (tick: number) => `${Math.round(Number(tick || 0))}%`;
  const defaultAmountFormatter = (v: number) => 
    new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(Number(v || 0));
  const defaultPercentFormatter = (v: number) => `${Math.round(Number(v || 0))}%`;

  // Side items for donut charts
  const categorySideItems = computed(() => 
    portfolioData.categorySlices.value.map((d, idx) => ({
      label: d.label,
      amount: d.amount,
      percent: d.percent,
      color: portfolioData.categoryColors.value[idx] || '#000000',
    }))
  );

  const offerSideItems = computed(() => 
    portfolioData.offerDonutData.value.map((d, idx) => ({
      label: d.name,
      percent: d.percent,
      color: portfolioData.offerColors.value[idx] || '#000000',
    }))
  );

  return {
    // Crypto data
    ...cryptoData,
    
    // Portfolio data
    ...portfolioData,
    
    // Wallet data
    ...walletData,
    
    // Combined loading state
    isLoading,
    
    // Formatters
    percentValueFormatter,
    defaultAmountFormatter,
    defaultPercentFormatter,
    
    // Side items
    categorySideItems,
    offerSideItems,
    
    topFundedOffer,
  };
}


