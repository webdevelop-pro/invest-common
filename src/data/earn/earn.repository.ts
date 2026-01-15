import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { EarnPositionFormatter, type EarnPositionsResponseFormatted } from './earn.formatter';
import { useRepositoryEvm } from '../evm/evm.repository';

export interface EarnDepositRequest {
  poolId: string;
  profileId: string | number;
  amount: number;
  symbol?: string;
}

export interface EarnDepositResponse {
  poolId: string;
  profileId: string | number;
  amount: number;
  status: 'success';
  txId: string;
}

export interface EarnPositionTransaction {
  id: number;
  date: string;
  time: string;
  amountUsd: number;
  txId: string;
  type: 'deposit' | 'withdraw';
  status: 'completed' | 'pending';
}

export interface EarnPositionsResponse {
  poolId: string;
  profileId: string | number;
  symbol: string;
  stakedAmountUsd: number;
  earnedAmountUsd: number;
  transactions: EarnPositionTransaction[];
  // Optional mock field used for exchange simulations
  availableAmountUsd?: number;
}

export const useRepositoryEarn = defineStore('repository-earn', () => {
  const depositState = createActionState<EarnDepositResponse>();
  /**
   * Holds the list of all positions across pools for the current session.
   * Used to preserve data when navigating between different pools.
   */
  const positionsPools = ref<EarnPositionsResponse[]>([]);
  /**
   * Holds the currently selected position (single pool/profile) with loading/error state.
   * Data is already formatted when retrieved from the repository.
   */
  const positionsState = createActionState<EarnPositionsResponseFormatted>();

  /**
   * Mock deposit request.
   * Updates the positions array with the new deposit data.
   * In the future this can be replaced with a real API call.
   */
  const deposit = async (payload: EarnDepositRequest) => {
    try {
      depositState.value.loading = true;
      depositState.value.error = null;

      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });

      const mockResponse: EarnDepositResponse = {
        poolId: payload.poolId,
        profileId: payload.profileId,
        amount: payload.amount,
        status: 'success',
        txId: `mock-tx-${Date.now()}`,
      };

      depositState.value.data = mockResponse;

      // Update positions array directly on deposit
      const list = positionsPools.value;
      const index = list.findIndex(
        (p: EarnPositionsResponse) =>
          p.poolId === payload.poolId && p.profileId === payload.profileId,
      );

      const newTransaction: EarnPositionTransaction = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amountUsd: payload.amount,
        txId: mockResponse.txId,
        type: 'withdraw',
        status: 'completed',
      };

      if (index !== -1) {
        // Accumulate: add new deposit to existing staked amount
        const existing = list[index] as EarnPositionsResponse;
        const newStakedAmount = existing.stakedAmountUsd + payload.amount;
        const newEarnedAmount = Number((newStakedAmount * 0.05).toFixed(2));

        // Use symbol from payload, fallback to existing or default
        const symbol = payload.symbol || existing.symbol || 'USDC';

        const updated: EarnPositionsResponse = {
          ...existing,
          symbol, // Ensure symbol is set
          stakedAmountUsd: newStakedAmount,
          earnedAmountUsd: newEarnedAmount,
          transactions: [newTransaction, ...existing.transactions],
        };

        const updatedList = [...list];
        updatedList[index] = updated;
        positionsPools.value = updatedList;
      } else {
        // Create new position data (first deposit for this pool/profile)
        const symbol = payload.symbol || 'USDC';
        
        const newPosition: EarnPositionsResponse = {
          poolId: payload.poolId,
          profileId: payload.profileId,
          symbol,
          stakedAmountUsd: payload.amount,
          earnedAmountUsd: Number((payload.amount * 0.05).toFixed(2)),
          transactions: [newTransaction],
        };

        positionsPools.value = [...list, newPosition];
      }

      return mockResponse;
    } catch (err) {
      depositState.value.error = err as Error;
      depositState.value.data = undefined;
      throw err;
    } finally {
      depositState.value.loading = false;
    }
  };

  /**
   * Mock get positions request for the Earn \"Your Position\" tab.
   * Filters the positions array by poolId and profileId to return data for the current pool.
   * Returns undefined if no position exists for the specified pool/profile.
   */
  const getPositions = async (poolId: string, profileId: string | number) => {
    try {
      positionsState.value.loading = true;
      positionsState.value.error = null;

      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      const list = positionsPools.value;

      // Filter by poolId and profileId to find the position for this pool
      const position = list.find(
        (p: EarnPositionsResponse) =>
          p.poolId === poolId && p.profileId === profileId,
      );

      // Format the position data using the formatter
      const formatter = new EarnPositionFormatter(position);
      const formattedPosition = formatter.format();
      positionsState.value.data = formattedPosition;

      // Return the formatted position if found, otherwise undefined (empty state)
      return formattedPosition;
    } catch (err) {
      positionsState.value.error = err as Error;
      positionsState.value.data = undefined;
      throw err;
    } finally {
      positionsState.value.loading = false;
    }
  };

  // Helper to get balance from crypto wallet for a given symbol
  const getWalletBalanceForSymbol = (symbol: string): number => {
    const evmRepository = useRepositoryEvm();
    const walletData = evmRepository.getEvmWalletState.data;
    if (!walletData?.balances) return 0;
    
    const balance = walletData.balances.find(
      (b: any) => b.symbol?.toUpperCase() === symbol.toUpperCase()
    );
    
    return balance ? Number(balance.amount || 0) : 0;
  };

  const mockExchangePositions = (payload: {
    profileId: string | number;
    fromSymbol: string;
    toSymbol: string;
    toPoolId: string;
    amount: number;
  }) => {
    const list = positionsPools.value;
    const now = new Date();

    const baseDate = now.toLocaleDateString();
    const baseTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedList: EarnPositionsResponse[] = [...list];

    // Helper to create transaction
    const createTx = (
      amountUsd: number,
      type: 'deposit' | 'withdraw',
      suffix: 'sell' | 'buy',
    ): EarnPositionTransaction => ({
      id: Date.now(),
      date: baseDate,
      time: baseTime,
      amountUsd: Math.abs(amountUsd), // Always use positive amount
      txId: `mock-exchange-${suffix}-${Date.now()}`,
      type,
      status: 'completed',
    });

    // 1) Add a withdraw transaction for the coin we sell (fromSymbol)
    //    If the position doesn't exist, create it using wallet balance as base
    const fromIndex = updatedList.findIndex(
      (p) =>
        p.profileId === payload.profileId
        && p.symbol?.toUpperCase() === payload.fromSymbol.toUpperCase(),
    );

    const sellTx = createTx(payload.amount, 'withdraw', 'sell');

    if (fromIndex !== -1) {
      const existing = updatedList[fromIndex];
      // Use wallet balance as base if availableAmountUsd is not set, otherwise use existing
      const walletBalance = getWalletBalanceForSymbol(payload.fromSymbol);
      const currentAvailable = existing.availableAmountUsd ?? walletBalance ?? existing.stakedAmountUsd ?? 0;
      const newAvailableAmountUsd = currentAvailable - payload.amount;

      updatedList[fromIndex] = {
        ...existing,
        availableAmountUsd: newAvailableAmountUsd,
        transactions: [sellTx, ...existing.transactions],
      };
    } else {
      // Get wallet balance for fromSymbol and subtract the amount
      const walletBalance = getWalletBalanceForSymbol(payload.fromSymbol);
      const newFromPosition: EarnPositionsResponse = {
        poolId: '', // unknown pool for pure "from" coin; can be filled later if needed
        profileId: payload.profileId,
        symbol: payload.fromSymbol,
        stakedAmountUsd: 0,
        earnedAmountUsd: 0,
        availableAmountUsd: walletBalance - payload.amount,
        transactions: [sellTx],
      };

      updatedList.push(newFromPosition);
    }

    // 2) Add to the coin we buy (toSymbol) for the target pool/profile
    const toIndex = updatedList.findIndex(
      (p) =>
        p.profileId === payload.profileId
        && p.poolId === payload.toPoolId,
    );

    const buyTx = createTx(payload.amount, 'deposit', 'buy');

    if (toIndex !== -1) {
      const existing = updatedList[toIndex];
      // Use wallet balance as base if availableAmountUsd is not set, otherwise use existing
      const walletBalance = getWalletBalanceForSymbol(payload.toSymbol);
      const currentAvailable = existing.availableAmountUsd ?? walletBalance ?? existing.stakedAmountUsd ?? 0;
      const newavailableAmountUsd = currentAvailable + payload.amount;

      updatedList[toIndex] = {
        ...existing,
        availableAmountUsd: newavailableAmountUsd,
        transactions: [buyTx, ...existing.transactions],
      };
    } else {
      // Get wallet balance for toSymbol and add the amount
      const walletBalance = getWalletBalanceForSymbol(payload.toSymbol);
      const newPosition: EarnPositionsResponse = {
        poolId: payload.toPoolId,
        profileId: payload.profileId,
        symbol: payload.toSymbol,
        stakedAmountUsd: 0,
        earnedAmountUsd: 0,
        availableAmountUsd: walletBalance + payload.amount,
        transactions: [buyTx],
      };

      updatedList.push(newPosition);
    }

    positionsPools.value = updatedList;
  };

  const resetAll = () => {
    depositState.value = {
      loading: false,
      error: null,
      data: undefined,
    };
    positionsState.value = {
      loading: false,
      error: null,
      data: undefined,
    };
    positionsPools.value = [];
  };

  return {
    depositState,
    positionsState,
    positionsPools,
    deposit,
    getPositions,
    mockExchangePositions,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEarn, import.meta.hot));
}


