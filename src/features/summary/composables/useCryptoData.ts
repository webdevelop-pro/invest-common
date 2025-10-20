import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryCryptoo, type CryptooId } from 'InvestCommon/data/3dParty/crypto.repository';

export type SupportedCoinId = CryptooId;

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

const COIN_NAMES: Record<SupportedCoinId, string> = {
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

export function useCryptoData() {
  const durationSec = ref(80);
  const cryptoRepo = useRepositoryCryptoo();
  const { getPricesState } = storeToRefs(cryptoRepo);

  const cryptoItems = computed(() => {
    const response = getPricesState.value?.data;
    if (!response) return [];
    
    return (Object.keys(response) as SupportedCoinId[]).map((id) => ({
      id,
      name: COIN_NAMES[id],
      priceUsd: response[id].usd,
      change24h: response[id].usd_24h_change,
    }));
  });

  onMounted(() => {
    void cryptoRepo.getSimplePrices(COIN_IDS);
  });

  return {
    durationSec,
    getPricesState,
    cryptoItems,
  };
}
