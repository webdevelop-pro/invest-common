import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { EarnPositionFormatter, type EarnPositionsResponseFormatted } from './earn.formatter';

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

      const now = new Date();
      const newTransaction: EarnPositionTransaction = {
        id: Date.now(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amountUsd: payload.amount,
        txId: mockResponse.txId,
        type: 'withdraw', // Withdraw from available balance to stake
        status: 'completed',
      };

      const updatedList = [...list];
      const symbol = payload.symbol || 'USDC';
      const EARN_RATE = 0.05; // 5% earned rate

      if (index !== -1) {
        // Update existing position
        const existing = list[index];
        const newStakedAmount = existing.stakedAmountUsd + payload.amount;
        const currentAvailable = existing.availableAmountUsd ?? 0;

        updatedList[index] = {
          ...existing,
          symbol: payload.symbol || existing.symbol || symbol,
          stakedAmountUsd: newStakedAmount,
          earnedAmountUsd: Number((newStakedAmount * EARN_RATE).toFixed(2)),
          availableAmountUsd: Math.max(0, currentAvailable - payload.amount),
          transactions: [newTransaction, ...existing.transactions],
        };
      } else {
        // Create new position
        updatedList.push({
          poolId: payload.poolId,
          profileId: payload.profileId,
          symbol,
          stakedAmountUsd: payload.amount,
          earnedAmountUsd: Number((payload.amount * EARN_RATE).toFixed(2)),
          availableAmountUsd: 0,
          transactions: [newTransaction],
        });
      }

      positionsPools.value = updatedList;

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

  /**
   * Helper to create transaction with current timestamp
   */
  const createTransaction = (
    amountUsd: number,
    type: 'deposit' | 'withdraw',
    suffix: 'sell' | 'buy',
  ): EarnPositionTransaction => {
    const now = new Date();
    return {
      id: Date.now(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountUsd: Math.abs(amountUsd),
      txId: `mock-exchange-${suffix}-${Date.now()}`,
      type,
      status: 'completed',
    };
  };

  /**
   * Helper to get or create position and update availableAmountUsd
   */
  const updatePositionAvailableAmount = (
    list: EarnPositionsResponse[],
    profileId: string | number,
    symbol: string,
    poolId: string,
    amountDelta: number,
    transaction: EarnPositionTransaction,
  ): void => {
    const symbolUpper = symbol.toUpperCase();
    const index = list.findIndex(
      (p) =>
        p.profileId === profileId &&
        (poolId ? p.poolId === poolId : p.symbol?.toUpperCase() === symbolUpper)
    );

    if (index !== -1) {
      const existing = list[index];
      const currentAvailable = existing.availableAmountUsd ?? existing.stakedAmountUsd ?? 0;
      list[index] = {
        ...existing,
        availableAmountUsd: currentAvailable + amountDelta,
        transactions: [transaction, ...existing.transactions],
      };
    } else {
      // Find existing position for the symbol to get current available amount
      const existingPosition = positionsPools.value.find(
        (p) => p.profileId === profileId && p.symbol?.toUpperCase() === symbolUpper
      );
      const currentAvailable = existingPosition?.availableAmountUsd ?? existingPosition?.stakedAmountUsd ?? 0;

      list.push({
        poolId: poolId || '',
        profileId,
        symbol,
        stakedAmountUsd: 0,
        earnedAmountUsd: 0,
        availableAmountUsd: currentAvailable + amountDelta,
        transactions: [transaction],
      });
    }
  };

  /**
   * Mock exchange positions - updates positionsPools with exchange transactions
   * Uses positionsPools as single source of truth for balances
   */
  const mockExchangePositions = (payload: {
    profileId: string | number;
    fromSymbol: string;
    toSymbol: string;
    toPoolId: string;
    fromAmount: number;
    toAmount: number;
  }) => {
    const updatedList: EarnPositionsResponse[] = [...positionsPools.value];

    // Update fromSymbol position (decrease availableAmountUsd)
    const sellTx = createTransaction(payload.fromAmount, 'withdraw', 'sell');
    updatePositionAvailableAmount(
      updatedList,
      payload.profileId,
      payload.fromSymbol,
      '',
      -payload.fromAmount,
      sellTx
    );

    // Update toSymbol position (increase availableAmountUsd)
    const buyTx = createTransaction(payload.toAmount, 'deposit', 'buy');
    updatePositionAvailableAmount(
      updatedList,
      payload.profileId,
      payload.toSymbol,
      payload.toPoolId,
      payload.toAmount,
      buyTx
    );

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


