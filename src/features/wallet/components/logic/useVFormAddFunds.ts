import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { useVFormFundsAdd } from 'InvestCommon/features/cryptoWallet/components/logic/useVFormFundsAdd';
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';

export type DepositMethodType = 'fiat' | 'crypto';

export type EvmDataForAddFunds = IEvmWalletDataFormatted | Record<string, unknown> | undefined | null;

const MAX_FIAT_AMOUNT = 1_000_000;

export function useVFormAddFunds(
  evmData: Ref<EvmDataForAddFunds> | ComputedRef<EvmDataForAddFunds>,
  onClose: () => void,
) {
  const depositMethod = ref<DepositMethodType>('crypto');

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const walletRepository = useRepositoryWallet();
  const { getWalletState, addTransactionState } = storeToRefs(walletRepository);
  const { getWalletByProfile } = walletRepository;
  const { addTransaction } = walletRepository;

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
    if (profileId.value && depositMethod.value === 'fiat') {
      getWalletByProfile(profileId.value);
    }
  };

  watch(depositMethod, (method) => {
    if (method === 'fiat') {
      loadFiatWallet();
    }
  });

  const isFiatSubmitDisabled = computed(
    () =>
      !fiatModel.value.amount ||
      Number(fiatModel.value.amount) <= 0 ||
      !fiatModel.value.funding_source_id ||
      Number(fiatModel.value.amount) > MAX_FIAT_AMOUNT ||
      addTransactionState.value.loading,
  );

  const fiatSubmitHandler = async () => {
    const wId = getWalletState.value.data?.id;
    if (!wId || !fiatModel.value.amount || !fiatModel.value.funding_source_id) return;
    try {
      await addTransaction(wId, {
        type: 'deposit',
        amount: Number(fiatModel.value.amount),
        funding_source_id: Number(fiatModel.value.funding_source_id),
      });
      onClose();
    } catch {
      // Error handled by repository toaster
    }
  };

  const addressRef = computed(() => (evmData.value as IEvmWalletDataFormatted | undefined)?.address);
  const { qrCodeDataURL, isGeneratingQR, copied, onCopyClick } = useVFormFundsAdd(addressRef);

  const assetOptions = computed(() => {
    const raw = evmData.value as IEvmWalletDataFormatted | undefined;
    const balances = Array.isArray(raw?.balances) ? raw.balances : [];
    const symbols = new Set<string>();
    balances.forEach((b: { symbol?: string }) => {
      if (b?.symbol) symbols.add(b.symbol);
    });
    const list = Array.from(symbols);
    if (list.length === 0) {
      return [{ value: 'USDC', text: 'USDC' }, { value: 'ETH', text: 'ETH' }];
    }
    return list.map((s) => ({ value: s, text: s }));
  });

  const selectedAsset = ref<string>('');
  watch(assetOptions, (opts) => {
    if (opts.length > 0 && !selectedAsset.value) {
      selectedAsset.value = opts[0].value ?? '';
    }
  }, { immediate: true });
  const depositNetworkLabel = 'ETH Ethereum (ERC20)';
  const selectedAssetWarning = computed(() =>
    selectedAsset.value
      ? `Send only ${selectedAsset.value} to this address via the Ethereum (ERC20) network. Sending other assets may result in permanent loss.`
      : 'Send only the selected token to this address via the Ethereum (ERC20) network. Sending other assets may result in permanent loss.',
  );

  return {
    depositMethod,
    depositNetworkLabel,
    fiatModel,
    fundingSourceFormatted,
    isFiatSubmitDisabled,
    fiatSubmitHandler,
    loadFiatWallet,
    numberFormatter,
    addTransactionState,
    maxFiatAmount: MAX_FIAT_AMOUNT,
    qrCodeDataURL,
    isGeneratingQR,
    copied,
    onCopyClick,
    assetOptions,
    selectedAsset,
    selectedAssetWarning,
    getWalletState,
  };
}
