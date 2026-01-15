import { computed, ref, unref } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { EvmWalletFormatter } from './formatter/wallet.formatter';
import { EvmTransactionFormatter } from './formatter/transactions.formatter';
import {
  IEvmWalletDataFormatted, IEvmWalletDataResponse, IEvmWithdrawRequestBody,
  IEvmExchangeRequestBody, IEvmExchangeResponse, EvmTransactionTypes, EvmTransactionStatusTypes,
  IEvmTransactionDataResponse,
} from './evm.types';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';
import { IProfileFormatted } from '../profiles/profiles.types';
import { useRepositoryEarn } from '../earn/earn.repository';

export const useRepositoryEvm = defineStore('repository-evm', () => {

    const userProfileStore = useProfilesStore();
    const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
    const userSessionStore = useSessionStore();
    const { userLoggedIn } = storeToRefs(userSessionStore);

  const apiClient = new ApiClient((env as any).EVM_URL);

  const getEvmWalletState = createActionState<IEvmWalletDataFormatted>();
  const withdrawFundsState = createActionState<IEvmWalletDataResponse>();
  const withdrawFundsOptionsState = createActionState<any>();
  const exchangeTokensState = createActionState<IEvmExchangeResponse>();
  const exchangeTokensOptionsState = createActionState<any>();

  // Loading states for websocket updates
  const isLoadingNotificationTransaction = ref(false);
  const isLoadingNotificationWallet = ref(false);

  const evmWalletId = computed(() => getEvmWalletState.value.data?.id || 0);

  /**
   * Mock function that adds all earn transactions to crypto wallet transactions
   */
  const addEarnTransactionsToWallet = (
    walletData: IEvmWalletDataResponse,
    profileId: number,
  ): IEvmWalletDataResponse => {
    const earnPositions = unref(useRepositoryEarn().positionsPools) || [];
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
            const dateTime = tx.date && tx.time 
              ? new Date(`${tx.date} ${tx.time}`).toISOString() 
              : new Date().toISOString();
            const type = typeMap[tx.type] || EvmTransactionTypes.deposit;
            
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
   * Updates crypto wallet balances based on earn positions
   * Uses availableAmountUsd from positionsPools as single source of truth
   */
  const addEarnBalancesToWallet = (
    walletData: IEvmWalletDataResponse,
    profileId: number,
  ): IEvmWalletDataResponse => {
    const earnPositions = unref(useRepositoryEarn().positionsPools) || [];
    const balances = { ...((walletData.balances as any) || {}) };
    
    // Update balances based on availableAmountUsd from positionsPools
    earnPositions
      .filter(p => p.profileId === profileId && p.symbol)
      .forEach(position => {
        const symbol = position.symbol.toUpperCase();
        const balanceAmount = position.availableAmountUsd ?? position.stakedAmountUsd ?? 0;
        
        if (balanceAmount <= 0) return;
        
        const balanceKey = Object.keys(balances).find(
          key => balances[key]?.symbol?.toUpperCase() === symbol
        );
        
        if (balanceKey) {
          balances[balanceKey] = {
            ...balances[balanceKey],
            amount: String(balanceAmount),
          };
        } else {
          balances[symbol.toLowerCase()] = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            amount: String(balanceAmount),
            symbol: position.symbol,
            name: position.symbol,
          };
        }
      });

    return {
      ...walletData,
      balances,
    };
  };

  const getEvmWalletByProfile = async (profileId: number) => {
    try {
      getEvmWalletState.value.loading = true;
      getEvmWalletState.value.error = null;
      const response = await apiClient.get<IEvmWalletDataResponse>(`/auth/wallet/${profileId}`);
      
      // Mock: Add earn transactions to wallet transactions
      let walletDataWithEarn = addEarnTransactionsToWallet(
        response.data as any,
        profileId,
      );
      
      // Mock: Update balances from earn exchanges
      walletDataWithEarn = addEarnBalancesToWallet(
        walletDataWithEarn,
        profileId,
      );
      
      const formatted = new EvmWalletFormatter(walletDataWithEarn as any).format();
      getEvmWalletState.value.data = formatted;
      return formatted;
    } catch (err) {
      getEvmWalletState.value.error = err as Error;
      getEvmWalletState.value.data = undefined;
      if ((err as any)?.data?.statusCode !== 404) {
        toasterErrorHandling(err, 'Failed to fetch EVM wallet');
      }
      throw err;
    } finally {
      getEvmWalletState.value.loading = false;
    }
  };

  const withdrawFunds = async (body: IEvmWithdrawRequestBody) => {
    try {
      withdrawFundsState.value.loading = true;
      withdrawFundsState.value.error = null;
      const response = await apiClient.post<IEvmWalletDataResponse>(`/auth/withdrawal`, body);
      withdrawFundsState.value.data = response.data;
      return withdrawFundsState.value.data;
    } catch (err) {
      withdrawFundsState.value.error = err as Error;
      withdrawFundsState.value.data = undefined;
      if ((err as any)?.data?.statusCode !== 404) {
        toasterErrorHandling(err, 'Failed to withdraw funds');
      }
      throw err;
    } finally {
      withdrawFundsState.value.loading = false;
    }
  };

  const withdrawFundsOptions = async () => {
    try {
      withdrawFundsOptionsState.value.loading = true;
      withdrawFundsOptionsState.value.error = null;
      const response = await apiClient.options<any>(`/auth/withdrawal`);
      withdrawFundsOptionsState.value.data = response.data;
      return withdrawFundsOptionsState.value.data;
    } catch (err) {
      withdrawFundsOptionsState.value.error = err as Error;
      withdrawFundsOptionsState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to fetch withdraw funds options');
      throw err;
    } finally {
      withdrawFundsOptionsState.value.loading = false;
    }
  };

  const exchangeTokens = async (body: IEvmExchangeRequestBody) => {
    try {
      exchangeTokensState.value.loading = true;
      exchangeTokensState.value.error = null;
      const response = await apiClient.post<IEvmExchangeResponse>(`/auth/exchange`, body);
      exchangeTokensState.value.data = response.data;
      return response.data;
    } catch (err) {
      exchangeTokensState.value.error = err as Error;
      exchangeTokensState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to exchange tokens');
      throw err;
    } finally {
      exchangeTokensState.value.loading = false;
    }
  };

  const exchangeTokensOptions = async () => {
    try {
      exchangeTokensOptionsState.value.loading = true;
      exchangeTokensOptionsState.value.error = null;
      const response = await apiClient.options<any>(`/auth/exchange`);
      exchangeTokensOptionsState.value.data = response.data;
      return exchangeTokensOptionsState.value.data;
    } catch (err) {
      exchangeTokensOptionsState.value.error = err as Error;
      exchangeTokensOptionsState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to fetch exchange tokens options');
      throw err;
    } finally {
      exchangeTokensOptionsState.value.loading = false;
    }
  };


  const updateNotificationData = (notification: INotification) => {
    const { obj, fields } = notification.data;
    const objectId = fields?.object_id;
    const wallet = getEvmWalletState.value.data;
    
    if (!wallet || !fields) return;

    const setTempLoading = (flag: typeof isLoadingNotificationWallet | typeof isLoadingNotificationTransaction) => {
      flag.value = true;
      setTimeout(() => { flag.value = false; }, 2000);
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
      
      const index = wallet.transactions.findIndex((t: any) => t.id === objectId);
      
      if (index !== -1) {
        Object.assign(wallet.transactions[index], mergedFields);
        // Re-format the updated transaction
        Object.assign(
          wallet.transactions[index], 
          new EvmTransactionFormatter(wallet.transactions[index] as any).format()
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
        
        Object.assign(newItem, new EvmTransactionFormatter(newItem as any).format());
        wallet.transactions.unshift(newItem);
      }

      getEvmWalletState.value.data = new EvmWalletFormatter(wallet as any).format();
    };

    const upsertWallet = () => {
      setTempLoading(isLoadingNotificationWallet);
      Object.assign(wallet, fields);

      getEvmWalletState.value.data = new EvmWalletFormatter(wallet as any).format();
    };

    const upsertBalance = () => {
      setTempLoading(isLoadingNotificationWallet);
      const addressFromFields = fields?.token?.address || '';
      if (objectId == null && !addressFromFields) return;
      
      const update: any = { ...fields };
      update.amount = Number(update.amount ?? 0);
      delete update.object_id;

      // Convert balances array to map for easier manipulation
      const balancesArray = wallet.balances as any[];
      const balancesMap: Record<string, any> = {};
      
      // Convert array to map using address as key
      balancesArray.forEach((balance: any) => {
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
      getEvmWalletState.value.data = new EvmWalletFormatter(wallet as any).format();
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

  const selectedIdAsDataIs = computed(() => selectedUserProfileData.value.id === selectedUserProfileId.value);
  const canLoadEvmWalletData = computed(() => (
    !hasRestrictedWalletBehavior(selectedUserProfileData.value)
    && selectedIdAsDataIs.value && userLoggedIn.value
    &&  selectedUserProfileData.value.isKycApproved && (selectedUserProfileId.value > 0)
    && !getEvmWalletState.value.loading && (selectedUserProfileId.value > 0)));

  const canLoadEvmWalletDataNotSelected = (profile: IProfileFormatted | undefined) => (
    profile !== undefined
    && !hasRestrictedWalletBehavior(profile)
    && userLoggedIn.value
    && profile.isKycApproved && (profile.id > 0)
    && !getEvmWalletState.value.loading);

  const resetAll = () => {
    getEvmWalletState.value = { loading: false, error: null, data: undefined };
    withdrawFundsState.value = { loading: false, error: null, data: undefined };
    withdrawFundsOptionsState.value = { loading: false, error: null, data: undefined };
    exchangeTokensState.value = { loading: false, error: null, data: undefined };
    exchangeTokensOptionsState.value = { loading: false, error: null, data: undefined };
    isLoadingNotificationTransaction.value = false;
    isLoadingNotificationWallet.value = false;
  };

  return {
    evmWalletId,
    getEvmWalletState,
    withdrawFundsState,
    withdrawFundsOptionsState,
    exchangeTokensState,
    exchangeTokensOptionsState,
    canLoadEvmWalletData,
    canLoadEvmWalletDataNotSelected,
    getEvmWalletByProfile,
    withdrawFunds,
    withdrawFundsOptions,
    exchangeTokens,
    exchangeTokensOptions,
    resetAll,
    updateNotificationData,
    isLoadingNotificationTransaction,
    isLoadingNotificationWallet,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEvm, import.meta.hot));
}
