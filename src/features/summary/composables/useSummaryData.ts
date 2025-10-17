import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryCryptoo, type CryptooId } from 'InvestCommon/data/3dParty/crypto.repository';
import { useDashboardPortfolioStore } from 'InvestCommon/features/investment/store/useDashboardPortfolio';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import VTableWalletTokensItem from 'InvestCommon/features/cryptoWallet/components/VTableWalletTokensItem.vue';
import env from 'InvestCommon/domain/config/env';
import { currency } from 'InvestCommon/helpers/currency';

export type SupportedCoinId = CryptooId;

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

export function useSummaryData() {
  // Crypto ticker
  const COIN_IDS: SupportedCoinId[] = [
    'bitcoin',
    'ethereum',
    'cardano',
    'solana',
    'ripple',
    'dogecoin',
    'litecoin',
    'polkadot',
    'tron',
    'avalanche-2',
    'chainlink',
  ];

  const durationSec = ref(80);

  const cryptoRepo = useRepositoryCryptoo();
  const { getPricesState } = storeToRefs(cryptoRepo);

  const cryptoItems = computed(() => {
    const response = getPricesState.value?.data;
    if (!response) return [] as Array<{ id: SupportedCoinId; name: string; priceUsd: number; change24h: number }>;
    const idToName: Record<SupportedCoinId, string> = {
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      cardano: 'Cardano',
      solana: 'Solana',
      ripple: 'XRP',
      dogecoin: 'Dogecoin',
      litecoin: 'Litecoin',
      polkadot: 'Polkadot',
      tron: 'TRON',
      'avalanche-2': 'Avalanche',
      chainlink: 'Chainlink',
    };
    return (Object.keys(response) as SupportedCoinId[]).map((id) => ({
      id,
      name: idToName[id],
      priceUsd: response[id].usd,
      change24h: response[id].usd_24h_change,
    }));
  });

  onMounted(async () => {
    void cryptoRepo.getSimplePrices(COIN_IDS);
    // ensure offers are loaded for topfindedoffer
    const { getOffersState } = storeToRefs(offerRepo);
    if (!getOffersState.value?.data) {
      void offerRepo.getOffers();
    }
  });

  // Portfolio data
  const portfolioStore = useDashboardPortfolioStore();
  const { portfolioData, getInvestmentsState } = storeToRefs(portfolioStore);

  // Offers
  const offerRepo = useRepositoryOffer();
  const topfindedoffer = computed(() => offerRepo.getTopOpenOffer());

  const totalAmount = computed(() => portfolioData.value.reduce((sum, inv) => sum + (inv.amount || 0), 0));

  // Slices by offer name (Assets Diversification)
  const offerSlices = computed(() => {
    const map = new Map<string, number>();
    for (const inv of portfolioData.value) {
      const key = inv.offer?.name || 'Unknown Offer';
      const current = map.get(key) || 0;
      map.set(key, current + (inv.amount || 0));
    }
    const arr = Array.from(map.entries()).map(([key, amount]) => ({ key, label: key, amount }));
    const total = totalAmount.value || 1;
    return arr
      .map((s) => ({ ...s, percent: (s.amount / total) * 100 }))
      .sort((a, b) => b.percent - a.percent);
  });

  const offerDonutData = computed<DonutDatum[]>(() => offerSlices.value.map((s) => ({ name: s.label, percent: s.percent })));
  const offerColors = computed(() => DEFAULT_CHART_COLORS.slice(0, offerDonutData.value.length));

  // Slices by security type (Investment Categories)
  const categorySlices = computed(() => {
    const map = new Map<string, number>();
    for (const inv of portfolioData.value) {
      const key = inv.offer?.security_type || 'Unknown';
      const current = map.get(key) || 0;
      map.set(key, current + (inv.amount || 0));
    }
    const arr = Array.from(map.entries()).map(([key, amount]) => ({ key, label: key, amount }));
    const total = totalAmount.value || 1;
    return arr
      .map((s) => ({ ...s, percent: (s.amount / total) * 100 }))
      .sort((a, b) => b.percent - a.percent);
  });

  const categoryDonutData = computed<DonutDatum[]>(() => categorySlices.value.map((s) => ({ name: s.label, percent: s.percent })));
  const categoryColors = computed(() => DEFAULT_CHART_COLORS.slice(0, categoryDonutData.value.length));

  // Wallet (EVM)
  const evmRepository = useRepositoryEvm();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);
  const walletRepository = useRepositoryWallet();
  const { getWalletState, canLoadWalletData } = storeToRefs(walletRepository);

  // Refetch wallets when selected profile or load-eligibility changes
  watch(
    () => [selectedUserProfileId.value],
    () => {

      if (canLoadWalletData.value) {
        walletRepository.getWalletByProfile(selectedUserProfileId.value);
      } else {
        walletRepository.resetAll();
      }

      if (canLoadEvmWalletData.value) {
        evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
      } else {
        evmRepository.resetAll();
      }
    },
    { immediate: true }
  );

  const walletTokensTop5 = computed(() => (
    (getEvmWalletState.value.data?.balances || [])
      .filter((b: any) => Number(b?.amount || 0) > 0)
      .slice(0, 5)
  ));

  // Wallet tables and balances for summary
  const walletTokensHeader = [
    { text: 'Icon' },
    { text: 'Name' },
    { text: 'Symbol' },
    { text: 'Amount' },
    { text: 'Network link' },
  ];

  // typed-safe env access for wallet scan URL
  const walletScanUrl = (env as any)?.CRYPTO_WALLET_SCAN_URL as string || '';

  const walletTokensTableRows = computed(() =>
    (walletTokensTop5?.value || [])
      .map((b: any) => ({
        name: String(b?.name || ''),
        amount: String(b?.amount ?? '0'),
        symbol: String(b?.symbol || ''),
        address: String(b?.address || ''),
        icon: b?.icon ? String(b.icon) : undefined,
      }))
  );

  const balances = computed(() => [
    {
      title: 'Crypto Wallet Balance:',
      balance: currency(getEvmWalletState.value.data?.currentBalance),
      href: getEvmWalletState.value.data?.address
        ? `${walletScanUrl}/address/${getEvmWalletState.value.data?.address}`
        : undefined,
    },
    {
      title: 'Wallet Balance:',
      balance: currency(getWalletState?.value?.data?.currentBalance),
    },
  ]);

  const tables = computed(() => [
    {
      title: 'Tokens:',
      header: walletTokensHeader,
      data: walletTokensTableRows.value || [],
      loading: getEvmWalletState.value.loading,
      rowLength: 5,
      colspan: walletTokensHeader.length,
      tableRowComponent: VTableWalletTokensItem,
    },
  ]);

  // Formatters shared across charts
  const percentValueFormatter = (tick: number) => `${Math.round(Number(tick || 0))}%`;
  const defaultAmountFormatter = (v: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v || 0));
  const defaultPercentFormatter = (v: number) => `${Math.round(Number(v || 0))}%`;

  const isLoading = computed(() => getPricesState.value?.loading || getInvestmentsState.value?.loading);

  return {
    // crypto
    durationSec,
    getPricesState,
    cryptoItems,

    // portfolio common
    getInvestmentsState,
    totalAmount,
    isLoading,

    // assets diversification
    offerSlices,
    offerDonutData,
    offerColors,

    // investment categories
    categorySlices,
    categoryDonutData,
    categoryColors,

    // formatters
    percentValueFormatter,
    defaultAmountFormatter,
    defaultPercentFormatter,

    // offers
    topfindedoffer,

    // wallet
    getEvmWalletState,
    getWalletState,
    walletTokensTop5,
    walletTokensTableRows,
    balances,
    tables,
  };
}


