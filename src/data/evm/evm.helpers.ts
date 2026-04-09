import {
  EvmWalletStatusTypes,
  type IEvmWalletChainAccount,
  type IEvmWalletDataResponse,
} from './evm.types';

export interface IEvmWalletChainAccountResponse {
  chain?: string;
  wallet_address?: string;
  chain_account_status?: string;
}

export interface IEvmWalletInfoStatusResponse {
  profile_id?: number;
  wallet_status?: string;
  chains?: IEvmWalletChainAccountResponse[];
  deposit_instructions?: {
    chain?: string;
    address?: string;
  };
  balances?: Array<{
    asset?: string;
    symbol?: string;
    address?: string;
    amount?: number | string;
  }> | Record<string, {
    asset?: string;
    symbol?: string;
    address?: string;
    amount?: number | string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export type IEvmWalletInfoApiResponse = IEvmWalletDataResponse | IEvmWalletInfoStatusResponse;

const KNOWN_WALLET_STATUSES = new Set<string>(Object.values(EvmWalletStatusTypes));

const normalizeWalletInfoBalances = (
  balances?: IEvmWalletInfoStatusResponse['balances'],
): IEvmWalletDataResponse['balances'] => {
  const balancesArray = Array.isArray(balances)
    ? balances
    : Object.values(balances ?? {});

  return balancesArray.reduce<IEvmWalletDataResponse['balances']>((acc, balance, index) => {
    const address = String(balance?.address ?? '').trim();
    const asset = String(balance?.asset ?? balance?.symbol ?? '').trim();
    const symbol = String(balance?.symbol ?? balance?.asset ?? '').trim();

    if (!address && !symbol) {
      return acc;
    }

    const key = address || symbol || String(index);
    acc[key] = {
      asset: asset || undefined,
      address,
      amount: balance?.amount ?? 0,
      symbol,
      name: symbol || undefined,
    };
    return acc;
  }, {});
};

const normalizeStatus = (
  walletStatus?: string | null,
  chainStatuses: string[] = [],
): EvmWalletStatusTypes => {
  const normalizedWalletStatus = String(walletStatus ?? '').trim().toLowerCase();
  if (KNOWN_WALLET_STATUSES.has(normalizedWalletStatus)) {
    return normalizedWalletStatus as EvmWalletStatusTypes;
  }

  const knownChainStatus = chainStatuses.find((status) => KNOWN_WALLET_STATUSES.has(status));
  if (knownChainStatus) {
    return knownChainStatus as EvmWalletStatusTypes;
  }

  if (chainStatuses.includes('pending')) {
    return EvmWalletStatusTypes.created;
  }

  return EvmWalletStatusTypes.created;
};

export const isEvmWalletLegacyResponse = (
  data: IEvmWalletInfoApiResponse,
): data is IEvmWalletDataResponse => (
  'status' in data
  && 'balance' in data
  && 'transactions' in data
);

export const normalizeEvmWalletInfoResponse = (
  data: IEvmWalletInfoApiResponse,
): IEvmWalletDataResponse => {
  if (isEvmWalletLegacyResponse(data)) {
    return data;
  }

  const chains = Array.isArray(data.chains) ? data.chains : [];
  const chainStatuses = chains
    .map((chain) => String(chain.chain_account_status ?? '').trim().toLowerCase())
    .filter(Boolean);
  const normalizedChains: IEvmWalletChainAccount[] = chains
    .map((chain) => ({
      chain: String(chain.chain ?? '').trim(),
      wallet_address: String(chain.wallet_address ?? '').trim(),
      chain_account_status: String(chain.chain_account_status ?? '').trim().toLowerCase() || undefined,
    }))
    .filter((chain) => Boolean(chain.chain));
  const firstWalletAddress = chains
    .map((chain) => String(chain.wallet_address ?? '').trim())
    .find(Boolean) ?? '';
  const depositInstructions = data.deposit_instructions
    ? {
      chain: String(data.deposit_instructions.chain ?? '').trim() || undefined,
      address: String(data.deposit_instructions.address ?? '').trim() || undefined,
    }
    : undefined;
  const updatedAt = data.updated_at ?? data.created_at ?? new Date().toISOString();

  return {
    id: Number(data.profile_id ?? 0),
    status: normalizeStatus(data.wallet_status, chainStatuses),
    balance: '0',
    inc_balance: 0,
    out_balance: 0,
    address: firstWalletAddress,
    deposit_instructions: depositInstructions,
    chains: normalizedChains,
    balances: normalizeWalletInfoBalances(data.balances),
    transactions: [],
    created_at: data.created_at ?? updatedAt,
    updated_at: updatedAt,
  };
};

export const extractDepositAddressFromWalletInfo = (
  data: IEvmWalletInfoApiResponse,
): string => {
  if (isEvmWalletLegacyResponse(data)) {
    return String(data.address ?? '').trim();
  }

  const depositInstructionAddress = String(data.deposit_instructions?.address ?? '').trim();
  if (depositInstructionAddress) {
    return depositInstructionAddress;
  }

  const balances = Array.isArray(data.balances)
    ? data.balances
    : Object.values(data.balances ?? {});
  const usdcBalanceAddress = balances
    .find((balance) => {
      const asset = String(balance?.asset ?? balance?.symbol ?? '').trim().toUpperCase();
      return asset === 'USDC';
    });
  const usdcAddress = String(usdcBalanceAddress?.address ?? '').trim();
  if (usdcAddress) {
    return usdcAddress;
  }

  const normalizedWallet = normalizeEvmWalletInfoResponse(data);
  return String(normalizedWallet.address ?? '').trim();
};
