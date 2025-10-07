import { ref } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const getEvmWalletStateRef = ref({
  data: {
    balances: [],
    pendingIncomingBalance: 0,
    pendingOutcomingBalance: 0,
  },
  loading: false,
});

vi.mock('InvestCommon/data/evm/evm.repository', () => {
  return {
    useRepositoryEvm: () => ({ getEvmWalletState: getEvmWalletStateRef }),
  };
});

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => {
  const selectedUserProfileData = ref({ isTypeSolo401k: false });
  return {
    useProfilesStore: () => ({ selectedUserProfileData }),
  };
});

import { useDashboardEvmWalletTokens } from '../useDashboardEvmWalletTokens';

describe('useDashboardEvmWalletTokens', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: {
        balances: [],
        pendingIncomingBalance: 0,
        pendingOutcomingBalance: 0,
      },
      loading: false,
    };
  });

  it('exposes table options from wallet state', () => {
    const { tableOptions } = useDashboardEvmWalletTokens();
    expect(tableOptions.value).toEqual([]);
    getEvmWalletStateRef.value.data.balances = [{ symbol: 'USDC' } as unknown as never];
    expect(tableOptions.value?.length).toBe(1);
  });

  it('shows incoming/outgoing when positive values', () => {
    const { isShowIncomingBalance, isShowOutgoingBalance } = useDashboardEvmWalletTokens();
    expect(isShowIncomingBalance.value).toBe(false);
    expect(isShowOutgoingBalance.value).toBe(false);
    getEvmWalletStateRef.value.data.pendingIncomingBalance = 1;
    getEvmWalletStateRef.value.data.pendingOutcomingBalance = 2;
    expect(isShowIncomingBalance.value).toBe(true);
    expect(isShowOutgoingBalance.value).toBe(true);
  });

  it('can withdraw when balances exist', () => {
    const { canWithdraw } = useDashboardEvmWalletTokens();
    expect(canWithdraw.value).toBe(false);
    getEvmWalletStateRef.value.data.balances = [{} as never];
    expect(canWithdraw.value).toBe(true);
  });

  it('reflects skeleton from loading state', () => {
    const { isSkeleton } = useDashboardEvmWalletTokens();
    expect(isSkeleton.value).toBe(false);
    getEvmWalletStateRef.value.loading = true as unknown as boolean;
    expect(isSkeleton.value).toBe(true);
  });
});


