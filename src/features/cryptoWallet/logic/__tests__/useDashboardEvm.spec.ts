import { ref, computed, nextTick, defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('vue-router', () => {
  const push = vi.fn();
  const sharedRoute = { query: {} as Record<string, string | string[] | undefined> };
  return {
    useRouter: () => ({ push }),
    useRoute: () => sharedRoute,
  };
});
import { useRouter, useRoute } from 'vue-router';

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => {
  const selectedUserProfileId = ref(123);
  const selectedUserProfileData = ref({
    id: 123,
    kyc_status: 'none',
    isKycNone: true,
    isKycNew: false,
    isKycPending: false,
    isKycInProgress: false,
    isKycDeclined: false,
    isTypeSdira: false,
  });
  return {
    useProfilesStore: () => ({ selectedUserProfileId, selectedUserProfileData }),
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => {
  return {
    useSessionStore: () => ({ userLoggedIn: ref(true) }),
  };
});

vi.mock('InvestCommon/data/profiles/profiles.repository', () => {
  return {
    useRepositoryProfiles: () => ({ getProfileByIdState: ref({ loading: false }) }),
  };
});

const getEvmWalletByProfile = vi.fn();
const getEvmWalletStateRef = ref({
  data: {
    isStatusAnyError: false,
    isStatusCreated: false,
  },
  loading: false,
  error: null as unknown,
});
const canLoadEvmWalletDataRef = ref(true);

vi.mock('InvestCommon/data/evm/evm.repository', () => {
  return {
    useRepositoryEvm: () => ({
      getEvmWalletState: getEvmWalletStateRef,
      canLoadEvmWalletData: canLoadEvmWalletDataRef,
      getEvmWalletByProfile,
    }),
  };
});

// Must import after mocks
import { useDashboardEvm } from '../useDashboardEvm';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';

// helper to mount composable inside a component
function mountComposable() {
  let api: ReturnType<typeof useDashboardEvm> | undefined;
  const Comp = defineComponent({
    setup() {
      api = useDashboardEvm();
      return () => h('div');
    },
  });
  mount(Comp);
  return api!;
}

describe('useDashboardEvm', () => {
  beforeEach(() => {
    getEvmWalletByProfile.mockClear();
    getEvmWalletStateRef.value = {
      data: { isStatusAnyError: false, isStatusCreated: false },
      loading: false,
      error: null,
    };
    canLoadEvmWalletDataRef.value = true;
  });

  it('calls repository to update data when allowed on mount', async () => {
    mountComposable();
    await nextTick();
    expect(getEvmWalletByProfile).toHaveBeenCalledTimes(1);
  });

  it('does not call repository if loading or error', async () => {
    getEvmWalletByProfile.mockClear();
    getEvmWalletStateRef.value.loading = true as unknown as boolean;
    mountComposable();
    await nextTick();
    expect(getEvmWalletByProfile).not.toHaveBeenCalled();

    getEvmWalletByProfile.mockClear();
    getEvmWalletStateRef.value.loading = false as unknown as boolean;
    getEvmWalletStateRef.value.error = new Error('boom');
    mountComposable();
    await nextTick();
    expect(getEvmWalletByProfile).not.toHaveBeenCalled();
  });

  it('computes alert info for KYC needed', async () => {
    const { isAlertShow, alertTitle, alertButtonText, isAlertType } = mountComposable();
    await nextTick();
    expect(isAlertShow.value).toBe(true);
    expect(alertTitle.value).toMatch(/Identity verification is needed/i);
    expect(alertButtonText.value).toBe('Verify Identity');
    expect(isAlertType.value).toBe('error');
  });

  it('navigates to KYC on alert button click when KYC needed', async () => {
    const { onAlertButtonClick } = mountComposable();
    const router = useRouter();
    onAlertButtonClick();
    expect(router.push).toHaveBeenCalled();
  });

  it('initializes transaction type from route query', async () => {
    const route = useRoute();
    route.query['add-transaction'] = EvmTransactionTypes.withdrawal;
    const { transactiontType } = mountComposable();
    await nextTick();
    expect(transactiontType.value).toBe(EvmTransactionTypes.withdrawal);
  });

  it('sets dialog open and transaction type on click', async () => {
    const { onTransactionClick, isDialogTransactionOpen, transactiontType } = mountComposable();
    onTransactionClick(EvmTransactionTypes.deposit);
    await nextTick();
    expect(transactiontType.value).toBe(EvmTransactionTypes.deposit);
    expect(isDialogTransactionOpen.value).toBe(true);
  });
});


