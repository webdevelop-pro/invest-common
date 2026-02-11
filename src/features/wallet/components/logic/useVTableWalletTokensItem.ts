import { computed } from 'vue';
import env from 'InvestCommon/domain/config/env';

interface ITableEvmWalletTransaction {
  name?: string;
  amount: string | number;
  symbol: string;
  address: string;
  icon?: string;
  price_per_usd?: number;
  tokenValue?: string;
}

export function useVTableWalletTokensItem(data: ITableEvmWalletTransaction | undefined) {
  const tokenScanUrl = computed(() => {
    if (!data?.address) return '';
    return `${env.CRYPTO_WALLET_SCAN_URL}/token/${data.address}`;
  });

  return {
    tokenScanUrl,
  };
}

