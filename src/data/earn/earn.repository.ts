import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { EarnPositionFormatter, type EarnPositionsResponseFormatted } from './earn.formatter';
import { createEarnPositionsService } from './earn.positions';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';

export interface EarnDepositRequest {
  poolId: string;
  profileId: string | number;
  amount: number;
  symbol?: string;
  name?: string;
}

export interface EarnDepositResponse {
  poolId: string;
  profileId: string | number;
  amount: number;
  status: 'success';
  txId: string;
}

export interface EarnWithdrawRequest {
  poolId: string;
  profileId: string | number;
  amount: number;
  symbol?: string;
  name?: string;
}

export interface EarnWithdrawResponse {
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
  type: 'deposit' | 'withdraw' | 'approval';
  status: 'completed' | 'pending';
}

export interface EarnPositionsResponse {
  poolId: string;
  profileId: string | number;
  symbol: string;
  name?: string;
  stakedAmountUsd: number;
  earnedAmountUsd: number;
  transactions: EarnPositionTransaction[];
  // Optional mock field used for exchange simulations
  availableAmountUsd?: number;
}

export const useRepositoryEarn = defineStore('repository-earn', () => {
  const depositState = createActionState<EarnDepositResponse>();
  const withdrawState = createActionState<EarnWithdrawResponse>();
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
   * Tracks approved tokens per pool/profile/symbol so approval state survives
   * route changes (e.g. switching to "your-position" tab remounts the view).
   */
  const approvedTokens = ref<Set<string>>(new Set());

  const approvalKey = (poolId: string, profileId: string | number, symbol: string) =>
    `${poolId}-${profileId}-${symbol}`;

  const isTokenApproved = (poolId: string, profileId: string | number, symbol: string) =>
    approvedTokens.value.has(approvalKey(poolId, profileId, symbol));

  const setTokenApproved = (poolId: string, profileId: string | number, symbol: string) => {
    approvedTokens.value = new Set([
      ...approvedTokens.value,
      approvalKey(poolId, profileId, symbol),
    ]);
  };

  const EARN_RATE = 0.05; // 5% earned rate
  const positionsService = createEarnPositionsService(EARN_RATE);

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

      const baseTimestamp = Date.now();
      const txId = `mock-tx-${baseTimestamp}`;

      const mockResponse: EarnDepositResponse = {
        poolId: payload.poolId,
        profileId: payload.profileId,
        amount: payload.amount,
        status: 'success',
        txId,
      };

      depositState.value.data = mockResponse;

      const newTransaction: EarnPositionTransaction = createTimestampedTransaction(
        payload.amount,
        'deposit',
        mockResponse.txId,
      );

      const updatedList = positionsService.upsertForDeposit(
        positionsPools.value,
        payload,
        newTransaction,
      );
      positionsPools.value = updatedList;

      // Sync EVM wallet balances from positionsPools (single source of truth)
      if (payload.symbol) {
        useRepositoryEvm().applyEarnSupplyToWallet(Number(payload.profileId));
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
   * Mock withdraw request.
   * Decreases staked amount and increases available balance, and adds a withdraw transaction.
   */
  const withdraw = async (payload: EarnWithdrawRequest) => {
    try {
      withdrawState.value.loading = true;
      withdrawState.value.error = null;

      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });

      const baseTimestamp = Date.now();
      const txId = `mock-withdraw-${baseTimestamp}`;

      const mockResponse: EarnWithdrawResponse = {
        poolId: payload.poolId,
        profileId: payload.profileId,
        amount: payload.amount,
        status: 'success',
        txId,
      };

      withdrawState.value.data = mockResponse;

      const newTransaction: EarnPositionTransaction = createTimestampedTransaction(
        payload.amount,
        'withdraw',
        mockResponse.txId,
      );

      const updatedList = positionsService.upsertForWithdraw(
        positionsPools.value,
        payload,
        newTransaction,
      );
      positionsPools.value = updatedList;

      // Sync EVM wallet balances from positionsPools (single source of truth)
      if (payload.symbol) {
        useRepositoryEvm().applyEarnWithdrawToWallet(Number(payload.profileId));
      }

      return mockResponse;
    } catch (err) {
      withdrawState.value.error = err as Error;
      withdrawState.value.data = undefined;
      throw err;
    } finally {
      withdrawState.value.loading = false;
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
   * Helper to create a timestamped transaction with consistent date/time formatting.
   */
  const createTimestampedTransaction = (
    amountUsd: number,
    type: EarnPositionTransaction['type'],
    txId: string,
  ): EarnPositionTransaction => {
    const now = new Date();
    return {
      id: Date.now(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountUsd: Math.abs(amountUsd),
      txId,
      type,
      status: 'completed',
    };
  };

  /**
   * Helper to create approval transaction with current timestamp
   */
  const createApprovalTransaction = (): EarnPositionTransaction => {
    const txId = `mock-approval-${Date.now()}`;
    return createTimestampedTransaction(0, 'approval', txId);
  };

  /**
   * Add an approval transaction for the given position without changing balances.
   * Optionally persists a human-readable token name on the position.
   */
  const mockApprovalTransaction = (payload: {
    profileId: string | number;
    poolId: string;
    symbol: string;
    name?: string;
  }) => {
    const updatedList: EarnPositionsResponse[] = [...positionsPools.value];
    const approvalTx = createApprovalTransaction();

    const index = updatedList.findIndex(
      (p) => p.profileId === payload.profileId && p.poolId === payload.poolId,
    );

    if (index !== -1) {
      const existing = updatedList[index];
      updatedList[index] = {
        ...existing,
        // Preserve existing name, but allow payload.name to set it if missing
        name: existing.name ?? payload.name,
        transactions: [approvalTx, ...existing.transactions],
      };
    } else {
      updatedList.push({
        poolId: payload.poolId,
        profileId: payload.profileId,
        symbol: payload.symbol,
        name: payload.name,
        stakedAmountUsd: 0,
        earnedAmountUsd: 0,
        availableAmountUsd: 0,
        transactions: [approvalTx],
      });
    }

    positionsPools.value = updatedList;
    setTokenApproved(payload.poolId, payload.profileId, payload.symbol);
  };

  const resetAll = () => {
    depositState.value = {
      loading: false,
      error: null,
      data: undefined,
    };
    withdrawState.value = {
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
    approvedTokens.value = new Set();
  };

  return {
    depositState,
    withdrawState,
    positionsState,
    positionsPools,
    deposit,
    withdraw,
    getPositions,
    mockApprovalTransaction,
    isTokenApproved,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEarn, import.meta.hot));
}


