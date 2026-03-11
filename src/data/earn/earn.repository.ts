import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
import { EarnPositionFormatter, type EarnPositionsResponseFormatted } from './earn.formatter';
import { createEarnPositionsService } from './earn.positions';

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

type EarnStates = {
  depositState: EarnDepositResponse;
  withdrawState: EarnWithdrawResponse;
  positionsState: EarnPositionsResponseFormatted;
};

/** Mock delay (ms) for deposit/withdraw simulation. */
const MOCK_DEPOSIT_WITHDRAW_DELAY_MS = 800;
/** Mock delay (ms) for getPositions simulation. */
const MOCK_GET_POSITIONS_DELAY_MS = 2000;

export const useRepositoryEarn = defineStore('repository-earn', () => {
  const earnPositionCache = createFormatterCache<
    EarnPositionsResponse | undefined,
    EarnPositionsResponseFormatted | undefined,
    string
  >({
    getKey: (position) => (position ? `${position.poolId}-${position.profileId}` : 'empty'),
    getSignature: (position) => {
      if (!position) {
        return 'empty';
      }
      const transactionsSignature = (position.transactions ?? [])
        .map((transaction) => `${transaction.id}:${transaction.type}:${transaction.status}:${transaction.amountUsd}:${transaction.txId}:${transaction.date}:${transaction.time}`)
        .join(';');

      return [
        position.poolId,
        position.profileId,
        position.symbol,
        position.stakedAmountUsd,
        position.earnedAmountUsd,
        position.transactions?.length ?? 0,
        transactionsSignature,
      ].join('|');
    },
    format: (position) => {
      if (!position) {
        return undefined;
      }
      return new EarnPositionFormatter(position).format();
    },
  });

  const {
    depositState,
    withdrawState,
    positionsState,
    resetAll: resetActionStates,
  } = createRepositoryStates<EarnStates>({
    depositState: undefined,
    withdrawState: undefined,
    positionsState: undefined,
  });
  /**
   * Holds the list of all positions across pools for the current session.
   * Used to preserve data when navigating between different pools.
   */
  const positionsPools = ref<EarnPositionsResponse[]>([]);
  /**
   * Holds the currently selected position (single pool/profile) with loading/error state.
   * Data is already formatted when retrieved from the repository.
   */
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
  const deposit = async (payload: EarnDepositRequest) =>
    withActionState(depositState, async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, MOCK_DEPOSIT_WITHDRAW_DELAY_MS);
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

      return mockResponse;
    });

  /**
   * Mock withdraw request.
   * Decreases staked amount and increases available balance, and adds a withdraw transaction.
   */
  const withdraw = async (payload: EarnWithdrawRequest) =>
    withActionState(withdrawState, async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, MOCK_DEPOSIT_WITHDRAW_DELAY_MS);
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

      return mockResponse;
    });

  /**
   * Mock get positions request for the Earn \"Your Position\" tab.
   * Filters the positions array by poolId and profileId to return data for the current pool.
   * Returns undefined if no position exists for the specified pool/profile.
   */
  const getPositions = async (poolId: string, profileId: string | number) =>
    withActionState(positionsState, async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, MOCK_GET_POSITIONS_DELAY_MS);
      });

      const list = positionsPools.value;

      const position = list.find(
        (p: EarnPositionsResponse) =>
          p.poolId === poolId && p.profileId === profileId,
      );

      const formattedPosition = earnPositionCache.format(position);
      return formattedPosition;
    });

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
    resetActionStates();
    earnPositionCache.clear();
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

