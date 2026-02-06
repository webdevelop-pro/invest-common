import { ref } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const getEvmWalletStateRef = ref({
  data: {
    balances: [],
    pendingIncomingBalance: 0,
    pendingOutcomingBalance: 0,
    isStatusCreated: true,
    isStatusVerified: false,
    isStatusAnyError: false,
  },
  loading: false,
  error: false,
});

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    isLoadingNotificationWallet: ref(false),
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: ref({ isKycApproved: true }),
    selectedUserProfileId: ref(1),
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useRoute: () => ({ name: ref('other'), path: '/' }),
}));

import { useWalletTokens } from '../useWalletTokens';
import { useWalletActions } from 'InvestCommon/features/wallet/logic/useWalletActions';

describe('useWalletTokens', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: {
        balances: [],
        pendingIncomingBalance: 0,
        pendingOutcomingBalance: 0,
        isStatusCreated: true,
        isStatusVerified: false,
        isStatusAnyError: false,
      },
      loading: false,
      error: false,
    };
  });

  it('exposes table and tokensOptions from wallet state', () => {
    const { table, tokensOptions } = useWalletTokens();
    expect(tokensOptions.value).toEqual([]);
    expect(table.value).toHaveLength(1);
    expect(table.value[0].title).toBe('Tokens:');
    getEvmWalletStateRef.value.data!.balances = [{ symbol: 'USDC' } as unknown as never];
    expect(tokensOptions.value?.length).toBe(1);
    expect(table.value[0].data?.length).toBe(1);
  });

  it('reflects loading state for skeleton', () => {
    const { isLoading } = useWalletTokens();
    expect(isLoading.value).toBe(false);
    getEvmWalletStateRef.value.loading = true;
    expect(isLoading.value).toBe(true);
  });
});

describe('useWalletActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: {
        balances: [],
        pendingIncomingBalance: 0,
        pendingOutcomingBalance: 0,
        isStatusCreated: true,
        isStatusVerified: false,
        isStatusAnyError: false,
      },
      loading: false,
      error: false,
    };
  });

  it('exposes buttonConfigs and handleButtonClick', () => {
    const { buttonConfigs, handleButtonClick } = useWalletActions({}, vi.fn());
    expect(buttonConfigs.value).toBeDefined();
    expect(handleButtonClick).toBeDefined();
  });
});
