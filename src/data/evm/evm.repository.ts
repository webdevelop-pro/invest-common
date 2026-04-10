import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import {
  applyOfflineHydrationMeta,
  createRepositoryStates,
  withActionState,
  type OptionsStateData,
} from 'InvestCommon/data/repository/repository';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { EvmWalletFormatter } from './formatter/wallet.formatter';
import { EvmTransactionFormatter } from './formatter/transactions.formatter';
import {
  IEvmWalletDataFormatted, IEvmWalletDataResponse, IEvmWithdrawRequestBody,
  IEvmExchangeRequestBody, IEvmExchangeResponse, EvmTransactionTypes, EvmTransactionStatusTypes,
  IEvmTransactionDataResponse, IEvmEarnPositionOverlay, IEvmWalletBalancesMap, IEvmWalletBalances,
  IEvmWalletAuthorizeStartRequestBody, IEvmWalletAuthorizeStartResponse, IEvmWalletAuthorizeConfirmRequestBody,
  IEvmWalletAuthorizeConfirmResponse, IEvmWithdrawResponse, IEvmWalletTransactionsApiItem,
  IEvmWalletTransactionsApiResponse, IEvmWalletAuthorizeSessionsResponse, IEvmWalletAuthorizeSession,
} from './evm.types';
import {
  extractDepositAddressFromWalletInfo,
  normalizeEvmWalletInfoResponse,
  type IEvmWalletInfoApiResponse,
} from './evm.helpers';

/** Duration (ms) to show loading state after a notification-driven wallet/transaction update. */
const NOTIFICATION_LOADING_DURATION_MS = 2000;
export type WalletChain = 'all' | 'ethereum' | 'ethereum-sepolia' | 'polygon' | 'base';
const DEFAULT_WALLET_CHAIN: WalletChain = 'ethereum-sepolia';
const DEPOSIT_WALLET_CHAINS: WalletChain[] = ['ethereum', 'polygon', 'base', 'ethereum-sepolia'];
const DEFAULT_BALANCE_HYDRATION_CHAIN: WalletChain = 'ethereum-sepolia';

const hasWalletBalances = (wallet?: IEvmWalletDataResponse | null): boolean =>
  Object.keys(wallet?.balances ?? {}).length > 0;

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const toTransactionType = (value: unknown): EvmTransactionTypes => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === EvmTransactionTypes.withdrawal) return EvmTransactionTypes.withdrawal;
  if (normalized === EvmTransactionTypes.exchange) return EvmTransactionTypes.exchange;
  return EvmTransactionTypes.deposit;
};

const toTransactionStatus = (value: unknown): EvmTransactionStatusTypes => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === EvmTransactionStatusTypes.processed) return EvmTransactionStatusTypes.processed;
  if (normalized === EvmTransactionStatusTypes.failed) return EvmTransactionStatusTypes.failed;
  if (normalized === EvmTransactionStatusTypes.cancelled) return EvmTransactionStatusTypes.cancelled;
  if (normalized === EvmTransactionStatusTypes.wait) return EvmTransactionStatusTypes.wait;
  return EvmTransactionStatusTypes.pending;
};

const getTransactionsCollection = (
  response: IEvmWalletTransactionsApiResponse,
): IEvmWalletTransactionsApiItem[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.transactions)) return response.transactions;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

const getAuthorizeSessionsCollection = (
  response: IEvmWalletAuthorizeSessionsResponse,
): IEvmWalletAuthorizeSession[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.sessions)) return response.sessions;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

const normalizeWalletTransaction = (item: IEvmWalletTransactionsApiItem): IEvmTransactionDataResponse => {
  const id = toNumberOrNull(item.id) ?? 0;
  const createdAt = String(item.created_at ?? item.updated_at ?? new Date().toISOString());
  const updatedAt = String(item.updated_at ?? item.created_at ?? createdAt);
  const transactionTx = String(item.transaction_tx ?? item.tx_hash ?? item.hash ?? '').trim();

  return {
    id,
    user_id: toNumberOrNull(item.user_id) ?? 0,
    dest_wallet_id: toNumberOrNull(item.dest_wallet_id),
    source_wallet_id: toNumberOrNull(item.source_wallet_id),
    investment_id: toNumberOrNull(item.investment_id),
    type: toTransactionType(item.type),
    amount: String(item.amount ?? '0'),
    ticker: String(item.ticker ?? '').trim() || undefined,
    symbol: String(item.symbol ?? item.ticker ?? '').trim() || undefined,
    name: String(item.name ?? '').trim() || undefined,
    icon: String(item.icon ?? '').trim() || undefined,
    image_link_id: item.image_link_id ?? undefined,
    network: String(item.network ?? '').trim() || 'ethereum',
    status: toTransactionStatus(item.status),
    transaction_tx: transactionTx,
    scan_tx_url: String(item.scan_tx_url ?? '').trim() || undefined,
    created_at: createdAt,
    updated_at: updatedAt,
    address: String(item.address ?? item.wallet_address ?? '').trim() || undefined,
    type_display: String(item.type_display ?? '').trim() || undefined,
    description: String(item.description ?? '').trim() || undefined,
  };
};

export type RegisterWalletPayload = {
  profile_id: number;
  provider_name: 'alchemy';
  wallet_address: string;
  stamped_whoami_request: unknown;
};

export type UpdateWalletMfaPayload = {
  provider_name: 'alchemy';
  mfa_enabled: boolean;
};

type EvmStates = {
  getEvmWalletState: IEvmWalletDataFormatted;
  withdrawFundsState: IEvmWithdrawResponse;
  withdrawFundsOptionsState: OptionsStateData;
  authorizeWithdrawStartState: IEvmWalletAuthorizeStartResponse;
  authorizeWithdrawConfirmState: IEvmWalletAuthorizeConfirmResponse;
  exchangeTokensState: IEvmExchangeResponse;
  exchangeTokensOptionsState: OptionsStateData;
  registerWalletState: OptionsStateData;
  updateWalletMfaState: OptionsStateData;
};

export const useRepositoryEvm = defineStore('repository-evm', () => {
  const apiClient = new ApiClient(env.EVM_URL);
  const evmTransactionCache = createFormatterCache<IEvmTransactionDataResponse, IEvmTransactionDataResponse>({
    getKey: (transaction) => transaction.id,
    getSignature: (transaction) => [
      transaction.updated_at,
      transaction.created_at,
      transaction.status,
      transaction.type,
      transaction.amount,
      transaction.transaction_tx,
      transaction.type_display,
      transaction.description,
      transaction.scan_tx_url,
    ].join('|'),
    format: (transaction) => new EvmTransactionFormatter(transaction).format(),
  });
  const evmWalletCache = createFormatterCache<IEvmWalletDataResponse, IEvmWalletDataFormatted>({
    getKey: (wallet) => wallet.id,
    getSignature: (wallet) => {
      const balances = Array.isArray(wallet.balances)
        ? wallet.balances
        : Object.values(wallet.balances || {});
      const chainsSignature = (wallet.chains || [])
        .map((chain) => `${chain.chain}|${chain.wallet_address}|${chain.chain_account_status ?? ''}`)
        .join(';');
      const balancesSignature = balances
        .map((balance) => `${balance.id}|${balance.address}|${balance.amount}|${balance.symbol}|${balance.name ?? ''}|${balance.icon ?? ''}|${balance.price_per_usd ?? ''}`)
        .join(';');
      const transactionsSignature = (wallet.transactions || [])
        .map((transaction) => `${transaction.id}|${transaction.updated_at}|${transaction.created_at}|${transaction.status}|${transaction.type}|${transaction.amount}|${transaction.transaction_tx ?? ''}`)
        .join(';');

      return [
        wallet.updated_at,
        wallet.status,
        wallet.balance,
        wallet.inc_balance,
        wallet.out_balance,
        chainsSignature,
        balances.length,
        balancesSignature,
        wallet.transactions?.length ?? 0,
        transactionsSignature,
      ].join('|');
    },
    format: (wallet) => new EvmWalletFormatter(wallet).format(),
  });

  const {
    getEvmWalletState,
    withdrawFundsState,
    withdrawFundsOptionsState,
    authorizeWithdrawStartState,
    authorizeWithdrawConfirmState,
    exchangeTokensState,
    exchangeTokensOptionsState,
    registerWalletState,
    updateWalletMfaState,
    resetAll: resetActionStates,
  } = createRepositoryStates<EvmStates>({
    getEvmWalletState: undefined,
    withdrawFundsState: undefined,
    withdrawFundsOptionsState: undefined,
    authorizeWithdrawStartState: undefined,
    authorizeWithdrawConfirmState: undefined,
    exchangeTokensState: undefined,
    exchangeTokensOptionsState: undefined,
    registerWalletState: undefined,
    updateWalletMfaState: undefined,
  });

  // Stores the latest raw wallet response from backend so we can
  // deterministically recompute Earn overlays (transactions/balances)
  // whenever mock Earn positions change.
  const baseWalletSnapshot = ref<IEvmWalletDataResponse | null>(null);

  // Loading states for websocket updates
  const isLoadingNotificationTransaction = ref(false);
  const isLoadingNotificationWallet = ref(false);

  const evmWalletId = computed(() => getEvmWalletState.value.data?.id || 0);

  /**
   * Mock function that adds all earn transactions to crypto wallet transactions.
   * @param earnPositions - Pass from feature layer (e.g. useRepositoryEarn().positionsPools).
   */
  const addEarnTransactionsToWallet = (
    walletData: IEvmWalletDataResponse,
    profileId: number,
    earnPositions: IEvmEarnPositionOverlay[],
  ): IEvmWalletDataResponse => {
    const existingTxIds = new Set((walletData.transactions || []).map(tx => tx.id));
    
    // Type and status mapping
    const typeMap: Record<string, EvmTransactionTypes> = {
      deposit: EvmTransactionTypes.deposit,
      withdraw: EvmTransactionTypes.withdrawal,
    };
    const statusMap: Record<string, EvmTransactionStatusTypes> = {
      completed: EvmTransactionStatusTypes.processed,
      pending: EvmTransactionStatusTypes.pending,
    };

    // Collect and convert earn transactions in a single pass
    const newTransactions = earnPositions
      .filter(p => p.profileId === profileId && p.transactions?.length && p.symbol)
      .flatMap(position =>
        position.transactions!
          .filter(tx => !existingTxIds.has(tx.id))
          .map(tx => {
            const symbol = position.symbol || 'USDC';
            const positionName = position.name || symbol;
            // Use a safe ISO timestamp instead of parsing formatted date/time strings
            const dateTime = new Date().toISOString();
            const type = typeMap[tx.type] || EvmTransactionTypes.deposit;

            // Provide explicit type label and description for Earn-originated transactions
            let type_display: string;
            let description: string;

            switch (tx.type) {
              case 'deposit':
                type_display = 'Earn Supply';
                description = `Supplied ${tx.amountUsd} ${symbol} to Earn (${positionName}).`;
                break;
              case 'withdraw':
                type_display = 'Earn Withdraw';
                description = `Withdrew ${tx.amountUsd} ${symbol} from Earn (${positionName}).`;
                break;
              case 'approval':
                type_display = 'Earn Approval';
                description = `Approved ${symbol} for Earn (${positionName}).`;
                break;
              default:
                type_display = 'Earn Transaction';
                description = `Earn ${tx.type} of ${tx.amountUsd} ${symbol}.`;
                break;
            }

            return {
              id: tx.id,
              user_id: profileId,
              dest_wallet_id: type === EvmTransactionTypes.deposit ? walletData.id : null,
              source_wallet_id: type === EvmTransactionTypes.withdrawal ? walletData.id : null,
              investment_id: null,
              type,
              amount: String(tx.amountUsd),
              symbol,
              name: symbol,
              network: 'ethereum',
              type_display,
              description,
              status: statusMap[tx.status] || EvmTransactionStatusTypes.pending,
              transaction_tx: tx.txId,
              created_at: dateTime,
              updated_at: dateTime,
            } as IEvmTransactionDataResponse;
          })
      );

    if (newTransactions.length === 0) {
      return walletData;
    }

    return {
      ...walletData,
      transactions: [...(walletData.transactions || []), ...newTransactions],
    };
  };

  /**
   * Updates crypto wallet balances based on earn positions.
   * @param earnPositions - Pass from feature layer (e.g. useRepositoryEarn().positionsPools).
   */
  const addEarnBalancesToWallet = (
    walletData: IEvmWalletDataResponse,
    profileId: number,
    earnPositions: IEvmEarnPositionOverlay[],
  ): IEvmWalletDataResponse => {
    const balances: IEvmWalletBalancesMap = { ...(walletData.balances || {}) };
    
    earnPositions
      .filter(p => p.profileId === profileId && p.symbol)
      .forEach(position => {
        const symbolKey = (position.symbol ?? '').toLowerCase();
        const nameLower = (position.name ?? '').toLowerCase();
        const stakedAmount = position.stakedAmountUsd ?? 0;

        if (stakedAmount <= 0) return;

        // First try to find an existing balance by BOTH symbol and name (when name is provided)
        let balanceKey = Object.keys(balances).find(key => {
          const balance = balances[key];
          if (!balance) return false;
          const balanceSymbol = String(balance.symbol || '').toLowerCase();
          const balanceName = String(balance.name || '').toLowerCase();
          const symbolMatch = balanceSymbol === symbolKey;
          const nameMatch = nameLower ? balanceName === nameLower : true;
          return symbolMatch && nameMatch;
        });

        // Fallback: match by symbol only
        if (!balanceKey) {
          balanceKey = Object.keys(balances).find(
            key => String(balances[key]?.symbol || '').toLowerCase() === symbolKey,
          );
        }

        // If there is no matching wallet balance for this token, we don't
        // create a new one here – Earn represents a separate "locked" bucket.
        if (!balanceKey) return;

        const prevAmount = Number(balances[balanceKey]?.amount ?? 0);
        const nextAmount = Math.max(0, prevAmount - stakedAmount);

        balances[balanceKey] = {
          ...balances[balanceKey],
          amount: String(nextAmount),
        };
      });

    return {
      ...walletData,
      balances,
    };
  };

  /**
   * Recompute wallet data from the latest backend snapshot plus current Earn positions.
   * This is used by mock Earn flows to keep the crypto wallet in sync without
   * mutating the snapshot or relying on already-formatted wallet state.
   */
  const recomputeWalletFromEarnOverlay = (profileId: number, earnPositions?: IEvmEarnPositionOverlay[]) => {
    if (!baseWalletSnapshot.value) return;

    const snapshot = baseWalletSnapshot.value;
    const positions = earnPositions ?? [];

    const walletCopy: IEvmWalletDataResponse = {
      ...snapshot,
      balances: { ...(snapshot.balances || {}) },
      transactions: [...(snapshot.transactions || [])],
    };

    let walletWithEarn = addEarnTransactionsToWallet(walletCopy, profileId, positions);
    walletWithEarn = addEarnBalancesToWallet(walletWithEarn, profileId, positions);

    evmTransactionCache.prune(walletWithEarn.transactions || []);
    getEvmWalletState.value.data = evmWalletCache.format(walletWithEarn);
  };

  /** Call from feature layer after Earn deposit; pass useRepositoryEarn().positionsPools. */
  const applyEarnSupplyToWallet = (profileId: number, earnPositions?: IEvmEarnPositionOverlay[]): void => {
    recomputeWalletFromEarnOverlay(profileId, earnPositions);
  };

  /** Call from feature layer after Earn withdraw; pass useRepositoryEarn().positionsPools. */
  const applyEarnWithdrawToWallet = (profileId: number, earnPositions?: IEvmEarnPositionOverlay[]): void => {
    recomputeWalletFromEarnOverlay(profileId, earnPositions);
  };

  const getEvmWalletTransactions = async (
    walletId: number,
    chain: WalletChain = DEFAULT_WALLET_CHAIN,
  ): Promise<IEvmTransactionDataResponse[]> => {
    if (!walletId) {
      return [];
    }

    const response = await apiClient.get<IEvmWalletTransactionsApiResponse>(`/auth/wallet/${walletId}/transactions`, {
      params: {
        chain,
      },
    });
    const transactions = getTransactionsCollection(response.data);

    return transactions.map(normalizeWalletTransaction);
  };

  const getEvmWalletByProfile = async (
    profileId: number,
    earnPositions?: IEvmEarnPositionOverlay[],
    chain: WalletChain = DEFAULT_WALLET_CHAIN,
  ) => {
    let responseHeaders: Headers | null = null;
    const result = await withActionState(getEvmWalletState, async () => {
      const response = await apiClient.get<IEvmWalletInfoApiResponse>(`/auth/wallet/${profileId}`, {
        params: {
          chain,
        },
      });
      responseHeaders = response.headers;
      const rawData = response.data as IEvmWalletInfoApiResponse;
      const data = normalizeEvmWalletInfoResponse(rawData);

      let walletData = data;
      if (chain === 'all' && !hasWalletBalances(data)) {
        const hydrationResponse = await apiClient.get<IEvmWalletInfoApiResponse>(`/auth/wallet/${profileId}`, {
          params: {
            chain: DEFAULT_BALANCE_HYDRATION_CHAIN,
          },
        });
        const hydrationRawData = hydrationResponse.data as IEvmWalletInfoApiResponse;
        const hydrationData = normalizeEvmWalletInfoResponse(hydrationRawData);
        const hydrationAddress = extractDepositAddressFromWalletInfo(hydrationRawData)
          || String(hydrationData.address ?? '').trim();

        walletData = {
          ...data,
          address: hydrationAddress || data.address,
          deposit_instructions: hydrationData.deposit_instructions ?? data.deposit_instructions,
          balances: hasWalletBalances(hydrationData) ? hydrationData.balances : data.balances,
          updated_at: hydrationData.updated_at || data.updated_at,
        };
      }

      const walletId = Number(walletData.id ?? 0);
      let transactions: IEvmTransactionDataResponse[] = Array.isArray(walletData.transactions)
        ? [...walletData.transactions]
        : [];

      if (walletId > 0) {
        try {
          transactions = await getEvmWalletTransactions(walletId, chain);
        } catch {
          transactions = [];
        }
      }

      baseWalletSnapshot.value = {
        ...walletData,
        transactions,
      };
      recomputeWalletFromEarnOverlay(profileId, earnPositions);
      return getEvmWalletState.value.data!;
    });
    if (responseHeaders) {
      applyOfflineHydrationMeta(getEvmWalletState, responseHeaders);
    }
    return result;
  };

  const getDepositNetworkByProfile = async (profileId: number, chain: Exclude<WalletChain, 'all'>) => {
    const response = await apiClient.get<IEvmWalletInfoApiResponse>(`/auth/wallet/${profileId}`, {
      params: {
        chain,
      },
    });
    const rawData = response.data as IEvmWalletInfoApiResponse;
    const data = normalizeEvmWalletInfoResponse(rawData);
    const address = extractDepositAddressFromWalletInfo(rawData) || String(data.address ?? '').trim();

    return {
      chain,
      wallet_address: address,
      chain_account_status: data.status,
    };
  };

  const authorizeWithdrawStart = async (
    profileId: number,
    body: IEvmWalletAuthorizeStartRequestBody,
  ) =>
    withActionState(authorizeWithdrawStartState, async () => {
      const response = await apiClient.post<IEvmWalletAuthorizeStartResponse>(
        `/auth/wallet/authorize/start/${profileId}`,
        body,
      );
      return response.data!;
    });

  const getAuthorizeSessions = async (
    profileId: number,
    filters: {
      assetAddress: string;
      chain: string;
      status?: string;
    },
  ) => {
    const response = await apiClient.get<IEvmWalletAuthorizeSessionsResponse>(
      `/auth/wallet/authorize/sessions/${profileId}`,
      {
        params: {
          chain: filters.chain,
          asset_address: filters.assetAddress,
          status: filters.status ?? 'active',
        },
      },
    );

    return getAuthorizeSessionsCollection(response.data as IEvmWalletAuthorizeSessionsResponse);
  };

  const authorizeWithdrawConfirm = async (
    profileId: number,
    body: IEvmWalletAuthorizeConfirmRequestBody,
  ) =>
    withActionState(authorizeWithdrawConfirmState, async () => {
      const response = await apiClient.post<IEvmWalletAuthorizeConfirmResponse>(
        `/auth/wallet/authorize/confirm/${profileId}`,
        body,
      );
      return response.data!;
    });

  const withdrawFunds = async (profileId: number, body: IEvmWithdrawRequestBody) =>
    withActionState(withdrawFundsState, async () => {
      const response = await apiClient.post<IEvmWithdrawResponse>(`/auth/withdrawal/${profileId}`, body);
      return response.data!;
    });

  const withdrawFundsOptions = async () =>
    withActionState(withdrawFundsOptionsState, async () => {
      const response = await apiClient.options<IEvmWalletDataResponse>(`/auth/withdrawal`);
      return response.data;
    });

  const exchangeTokens = async (body: IEvmExchangeRequestBody) =>
    withActionState(exchangeTokensState, async () => {
      const response = await apiClient.post<IEvmExchangeResponse>(`/auth/exchange`, body);
      return response.data!;
    });

  const exchangeTokensOptions = async () =>
    withActionState(exchangeTokensOptionsState, async () => {
      const response = await apiClient.options<IEvmExchangeResponse>(`/auth/exchange`);
      return response.data;
    });

  const registerWallet = async (profileId: number, payload: RegisterWalletPayload) =>
    withActionState(registerWalletState, async () => {
      const response = await apiClient.put(`/auth/wallet/register/${profileId}`, payload);
      return response.data;
    });

  const updateWalletMfa = async (profileId: number, payload: UpdateWalletMfaPayload) =>
    withActionState(updateWalletMfaState, async () => {
      const response = await apiClient.put(`/auth/wallet/mfa/${profileId}`, payload);
      return response.data;
    });


  const updateNotificationData = (notification: INotification) => {
    const { obj, fields } = notification.data;
    const objectId = fields?.object_id;
    const wallet = getEvmWalletState.value.data;
    
    if (!wallet || !fields) return;

    const setTempLoading = (flag: typeof isLoadingNotificationWallet | typeof isLoadingNotificationTransaction) => {
      flag.value = true;
      setTimeout(() => { flag.value = false; }, NOTIFICATION_LOADING_DURATION_MS);
    };

    const upsertTransaction = () => {
      setTempLoading(isLoadingNotificationTransaction);
      if (!objectId || typeof objectId !== 'number') return;
      
      if (!wallet.transactions) {
        wallet.transactions = [];
      }
      
      // Extract token fields and map them to transaction structure
      const tokenFields = fields.token ? {
        address: fields.token.address,
        name: fields.token.name,
        symbol: fields.token.name, // Use name as symbol if symbol not provided
      } : {};
      
      // Prepare transaction fields, excluding the nested token object
      const { token, ...transactionFields } = fields;
      const mergedFields = {
        ...transactionFields,
        ...tokenFields,
      };
      
      const index = wallet.transactions.findIndex((t: IEvmTransactionDataResponse) => t.id === objectId);

      if (index !== -1) {
        Object.assign(wallet.transactions[index], mergedFields);
        Object.assign(
          wallet.transactions[index],
          evmTransactionCache.format(wallet.transactions[index] as IEvmTransactionDataResponse)
        );
      } else {
        // Create a new transaction with required fields
        const baseItem = {
          id: objectId,
          user_id: 0, // Will be set by backend
          dest_wallet_id: null,
          source_wallet_id: null,
          investment_id: null,
          type: EvmTransactionTypes.deposit,
          amount: '0',
          network: 'ethereum',
          status: EvmTransactionStatusTypes.pending,
          transaction_tx: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Merge fields but preserve required structure
        const newItem = {
          ...baseItem,
          ...mergedFields,
          // Ensure type and status are valid enum values
          // eslint-disable-next-line vue/max-len
          type: (mergedFields.type && Object.values(EvmTransactionTypes).includes(mergedFields.type as EvmTransactionTypes)) 
            ? mergedFields.type as EvmTransactionTypes 
            : EvmTransactionTypes.deposit,
          status: (mergedFields.status
            && Object.values(EvmTransactionStatusTypes).includes(mergedFields.status as EvmTransactionStatusTypes)) 
            ? mergedFields.status as EvmTransactionStatusTypes 
            : EvmTransactionStatusTypes.pending,
        };
        
        Object.assign(newItem, evmTransactionCache.format(newItem as IEvmTransactionDataResponse));
        wallet.transactions.unshift(newItem);
      }

      evmTransactionCache.prune(wallet.transactions || []);
      getEvmWalletState.value.data = evmWalletCache.format(wallet as IEvmWalletDataResponse);
    };

    const upsertWallet = () => {
      setTempLoading(isLoadingNotificationWallet);
      Object.assign(wallet, fields);

      evmTransactionCache.prune(wallet.transactions || []);
      getEvmWalletState.value.data = evmWalletCache.format(wallet as IEvmWalletDataResponse);
    };

    const upsertBalance = () => {
      setTempLoading(isLoadingNotificationWallet);
      const addressFromFields = fields?.token?.address || '';
      if (objectId == null && !addressFromFields) return;

      const update: Record<string, unknown> = { ...fields };
      update.amount = Number(update.amount ?? 0);
      delete update.object_id;

      const balancesArray = (wallet.balances || []) as IEvmWalletBalances[];
      const balancesMap: Record<string, IEvmWalletBalances> = {};
      
      // Convert array to map using address as key
      balancesArray.forEach((balance: IEvmWalletBalances) => {
        if (balance.address) {
          balancesMap[balance.address] = { ...balance };
        }
      });

      // 1) Try update by address key if present
      if (addressFromFields && balancesMap[addressFromFields]) {
        Object.assign(balancesMap[addressFromFields], update);
      } else if (objectId != null) {
        // 2) Find entry by id === objectId and update it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const foundKey = Object.entries(balancesMap).find(([_, v]) => v?.id === objectId)?.[0];
        if (foundKey) {
          Object.assign(balancesMap[foundKey], update);
        }
      } else if (addressFromFields) {
        // 3) If not found, create new entry keyed by address (when provided)
        const base = { 
          id: objectId || 0,
          address: addressFromFields, 
          amount: 0, 
          symbol: '', 
          name: undefined, 
          icon: undefined 
        };
        balancesMap[addressFromFields] = Object.assign(base, update);
      }

      // Convert map back to array
      wallet.balances = Object.values(balancesMap);
      evmTransactionCache.prune(wallet.transactions || []);
      getEvmWalletState.value.data = evmWalletCache.format(wallet as IEvmWalletDataResponse);
    };

    switch (obj) {
      case 'evm_transfer':
        upsertTransaction();
        break;
      case 'evm_wallet':
        upsertWallet();
        break;
      case 'evm_contract':
        upsertBalance();
        break;
      default:
        break;
    }
  };

  const resetAll = () => {
    resetActionStates();
    evmTransactionCache.clear();
    evmWalletCache.clear();
    isLoadingNotificationTransaction.value = false;
    isLoadingNotificationWallet.value = false;
    baseWalletSnapshot.value = null;
  };

  return {
    evmWalletId,
    getEvmWalletState,
    withdrawFundsState,
    withdrawFundsOptionsState,
    authorizeWithdrawStartState,
    authorizeWithdrawConfirmState,
    exchangeTokensState,
    exchangeTokensOptionsState,
    registerWalletState,
    updateWalletMfaState,
    getEvmWalletByProfile,
    getEvmWalletTransactions,
    getDepositNetworkByProfile,
    depositWalletChains: DEPOSIT_WALLET_CHAINS,
    getAuthorizeSessions,
    authorizeWithdrawStart,
    authorizeWithdrawConfirm,
    withdrawFunds,
    withdrawFundsOptions,
    exchangeTokens,
    exchangeTokensOptions,
    registerWallet,
    updateWalletMfa,
    resetAll,
    updateNotificationData,
    isLoadingNotificationTransaction,
    isLoadingNotificationWallet,
    applyEarnSupplyToWallet,
    applyEarnWithdrawToWallet,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEvm, import.meta.hot));
}
