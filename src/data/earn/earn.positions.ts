import { computed, type Ref } from 'vue';
import type {
  EarnDepositRequest,
  EarnWithdrawRequest,
  EarnPositionTransaction,
  EarnPositionsResponse,
} from './earn.repository';

const DEFAULT_EARN_RATE = 0.05;

export function createEarnPositionsService(earnRate: number = DEFAULT_EARN_RATE) {
  const findIndexForPosition = (
    list: EarnPositionsResponse[],
    payload: { poolId: string; profileId: string | number; name?: string },
  ): number =>
    list.findIndex((p: EarnPositionsResponse) => {
      const samePoolAndProfile =
        p.poolId === payload.poolId && p.profileId === payload.profileId;
      const sameName = payload.name != null && p.name === payload.name;
      return samePoolAndProfile || sameName;
    });

  const applyCommonUpdate = (
    list: EarnPositionsResponse[],
    payload: {
      poolId: string;
      profileId: string | number;
      symbol?: string;
      name?: string;
      amount: number;
    },
    transaction: EarnPositionTransaction,
    opts: {
      findIndex: (items: EarnPositionsResponse[]) => number;
      getNextForExisting: (existing: EarnPositionsResponse) => {
        staked: number;
        available: number;
        earned: number;
      };
      getNextForNew: () => {
        staked: number;
        available: number;
        earned: number;
      };
    },
  ): EarnPositionsResponse[] => {
    const updatedList = [...list];
    const symbol = payload.symbol || 'USDC';
    const name = payload.name;

    const index = opts.findIndex(updatedList);

    if (index !== -1) {
      const existing = updatedList[index];
      const next = opts.getNextForExisting(existing);

      updatedList[index] = {
        ...existing,
        symbol: payload.symbol || existing.symbol || symbol,
        name: name || existing.name,
        stakedAmountUsd: next.staked,
        earnedAmountUsd: next.earned,
        availableAmountUsd: next.available,
        transactions: [transaction, ...existing.transactions],
      };
    } else {
      const next = opts.getNextForNew();

      updatedList.push({
        poolId: payload.poolId,
        profileId: payload.profileId,
        symbol,
        name,
        stakedAmountUsd: next.staked,
        earnedAmountUsd: next.earned,
        availableAmountUsd: next.available,
        transactions: [transaction],
      });
    }

    return updatedList;
  };

  const upsertForDeposit = (
    list: EarnPositionsResponse[],
    payload: EarnDepositRequest,
    transaction: EarnPositionTransaction,
  ): EarnPositionsResponse[] => {
    return applyCommonUpdate(
      list,
      payload,
      transaction,
      {
        findIndex: (items) => findIndexForPosition(items, payload),
        getNextForExisting: (existing) => {
          const staked = existing.stakedAmountUsd + payload.amount;
          const currentAvailable = existing.availableAmountUsd ?? 0;
          return {
            staked,
            earned: Number((staked * earnRate).toFixed(2)),
            available: Math.max(0, currentAvailable - payload.amount),
          };
        },
        getNextForNew: () => ({
          staked: payload.amount,
          earned: Number((payload.amount * earnRate).toFixed(2)),
          available: 0,
        }),
      },
    );
  };

  const upsertForWithdraw = (
    list: EarnPositionsResponse[],
    payload: EarnWithdrawRequest,
    transaction: EarnPositionTransaction,
  ): EarnPositionsResponse[] => {
    return applyCommonUpdate(
      list,
      payload,
      transaction,
      {
        findIndex: (items) => findIndexForPosition(items, payload),
        getNextForExisting: (existing) => {
          const staked = Math.max(0, existing.stakedAmountUsd - payload.amount);
          const currentAvailable = existing.availableAmountUsd ?? 0;
          return {
            staked,
            earned: Number((staked * earnRate).toFixed(2)),
            available: currentAvailable + payload.amount,
          };
        },
        getNextForNew: () => ({
          staked: 0,
          earned: 0,
          available: payload.amount,
        }),
      },
    );
  };

  return {
    upsertForDeposit,
    upsertForWithdraw,
  };
}

export function useEarnPositions(
  positionsRef: Ref<EarnPositionsResponse[]>,
  earnRate: number = DEFAULT_EARN_RATE,
) {
  const service = computed(() => createEarnPositionsService(earnRate));

  const applyDeposit = (payload: EarnDepositRequest, tx: EarnPositionTransaction) => {
    positionsRef.value = service.value.upsertForDeposit(positionsRef.value, payload, tx);
  };

  const applyWithdraw = (payload: EarnWithdrawRequest, tx: EarnPositionTransaction) => {
    positionsRef.value = service.value.upsertForWithdraw(positionsRef.value, payload, tx);
  };

  return {
    service,
    applyDeposit,
    applyWithdraw,
  };
}

