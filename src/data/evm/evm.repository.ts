import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { createRepositoryStates, withActionState, type OptionsStateData } from 'InvestCommon/data/repository/repository';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { EvmWalletFormatter } from './formatter/wallet.formatter';
import { EvmTransactionFormatter } from './formatter/transactions.formatter';
import {
  IEvmWalletDataFormatted, IEvmWalletDataResponse, IEvmWithdrawRequestBody,
  IEvmExchangeRequestBody, IEvmExchangeResponse, EvmTransactionTypes, EvmTransactionStatusTypes,
  IEvmTransactionDataResponse, IEvmEarnPositionOverlay, IEvmWalletBalancesMap, IEvmWalletBalances,
} from './evm.types';

/** Duration (ms) to show loading state after a notification-driven wallet/transaction update. */
const NOTIFICATION_LOADING_DURATION_MS = 2000;

type EvmStates = {
  getEvmWalletState: IEvmWalletDataFormatted;
  withdrawFundsState: IEvmWalletDataResponse;
  withdrawFundsOptionsState: OptionsStateData;
  exchangeTokensState: IEvmExchangeResponse;
  exchangeTokensOptionsState: OptionsStateData;
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
    exchangeTokensState,
    exchangeTokensOptionsState,
    resetAll: resetActionStates,
  } = createRepositoryStates<EvmStates>({
    getEvmWalletState: undefined,
    withdrawFundsState: undefined,
    withdrawFundsOptionsState: undefined,
    exchangeTokensState: undefined,
    exchangeTokensOptionsState: undefined,
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

  const getEvmWalletByProfile = async (profileId: number, earnPositions?: IEvmEarnPositionOverlay[]) => {
    const result = await withActionState(getEvmWalletState, async () => {
      const response = await apiClient.get<IEvmWalletDataResponse>(`/auth/wallet/${profileId}`);
      const data = response.data as IEvmWalletDataResponse;
      baseWalletSnapshot.value = data;
      recomputeWalletFromEarnOverlay(profileId, earnPositions);
      return getEvmWalletState.value.data!;
    });
    return result;
  };

  const withdrawFunds = async (body: IEvmWithdrawRequestBody) =>
    withActionState(withdrawFundsState, async () => {
      const response = await apiClient.post<IEvmWalletDataResponse>(`/auth/withdrawal`, body);
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
    exchangeTokensState,
    exchangeTokensOptionsState,
    getEvmWalletByProfile,
    withdrawFunds,
    withdrawFundsOptions,
    exchangeTokens,
    exchangeTokensOptions,
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
