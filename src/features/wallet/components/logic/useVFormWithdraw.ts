import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { useVFormFundsWithdraw } from 'InvestCommon/features/cryptoWallet/components/logic/useVFormFundsWithdraw';

export type WithdrawalMethodType = 'fiat' | 'crypto';

const MAX_FIAT_WITHDRAW = 1_000_000;

export function useVFormWithdraw(onClose: () => void) {
  const withdrawalMethod = ref<WithdrawalMethodType>('crypto');

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const walletRepository = useRepositoryWallet();
  const { getWalletState, addTransactionState } = storeToRefs(walletRepository);
  const { getWalletByProfile, addTransaction } = walletRepository;

  const profileId = computed(() => Number(selectedUserProfileId.value ?? 0));

  const fiatModel = ref({
    amount: undefined as number | undefined,
    funding_source_id: undefined as number | string | undefined,
  });

  const fundingSourceFormatted = computed(() =>
    (getWalletState.value.data?.funding_source ?? []).map((item: { id: number; bank_name: string; name: string }) => ({
      id: item.id,
      text: `${item.bank_name}: ${item.name}`,
    })),
  );

  const loadFiatWallet = () => {
    if (profileId.value && withdrawalMethod.value === 'fiat') {
      getWalletByProfile(profileId.value);
    }
  };

  watch(withdrawalMethod, (method) => {
    if (method === 'fiat') loadFiatWallet();
  });

  const isFiatSubmitDisabled = computed(
    () =>
      !fiatModel.value.amount ||
      Number(fiatModel.value.amount) <= 0 ||
      !fiatModel.value.funding_source_id ||
      Number(fiatModel.value.amount) > MAX_FIAT_WITHDRAW ||
      addTransactionState.value.loading,
  );

  const fiatSubmitHandler = async () => {
    const wId = getWalletState.value.data?.id;
    if (!wId || !fiatModel.value.amount || !fiatModel.value.funding_source_id) return;
    try {
      await addTransaction(wId, {
        type: 'withdrawal',
        amount: Number(fiatModel.value.amount),
        funding_source_id: Number(fiatModel.value.funding_source_id),
      });
      onClose();
    } catch {
      // Error handled by repository toaster
    }
  };

  const cryptoWithdraw = useVFormFundsWithdraw(onClose);

  return {
    withdrawalMethod,
    fiatModel,
    fundingSourceFormatted,
    isFiatSubmitDisabled,
    fiatSubmitHandler,
    loadFiatWallet,
    numberFormatter,
    addTransactionState,
    maxFiatWithdraw: MAX_FIAT_WITHDRAW,
    ...cryptoWithdraw,
  };
}
