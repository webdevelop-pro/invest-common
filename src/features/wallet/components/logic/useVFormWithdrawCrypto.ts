import {
  computed, reactive, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'UiKit/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useRepositoryEvm, type WalletChain } from 'InvestCommon/data/evm/evm.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { IEvmWithdrawRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';
import { useWalletOperationAuthorization } from 'InvestCommon/features/wallet/logic/useWalletOperationAuthorization';
import {
  getWalletNetworkPresentation,
  useWalletNetwork,
} from 'InvestCommon/features/wallet/logic/useWalletNetwork';

type WithdrawChain = Exclude<WalletChain, 'all'>;
type WithdrawChainOption = {
  id: WithdrawChain;
  value: WithdrawChain;
  text: string;
};

type WithdrawTokenOption = IEvmWalletBalances & {
  id: string;
  value: string;
  text: string;
};

const CHAIN_LABELS: Record<WithdrawChain, string> = {
  ethereum: 'Ethereum',
  'ethereum-sepolia': 'Ethereum Sepolia',
  polygon: 'Polygon',
  base: 'Base',
} as const;

const isWithdrawChain = (value: string): value is WithdrawChain => value in CHAIN_LABELS;
const normalizeAssetKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

type WithdrawCryptoFormModel = {
  chain?: string;
  asset?: string;
  amount?: number;
  destination_address?: string;
  idempotency_key?: string;
};

type WithdrawCryptoSubmission = IEvmWithdrawRequestBody;

export function useVFormWithdrawCrypto(
  emitClose?: () => void,
) {
  const evmRepository = useRepositoryEvm();
  const profilesStore = useProfilesStore();
  const sessionStore = useSessionStore();
  const { toast } = useToast();
  const { authorizeOperation } = useWalletOperationAuthorization();
  const { defaultNetwork, selectedNetwork, networkOptions } = useWalletNetwork();
  const { getEvmWalletState, withdrawFundsState } = storeToRefs(evmRepository);
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);

  const errorData = computed(() => (withdrawFundsState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => undefined);
  const fieldsPaths = ['chain', 'asset', 'amount', 'destination_address'];

  const schemaAddTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      WalletWithdraw: {
        properties: {
          amount: {
            type: 'number',
            // maximum: maxWithdraw.value,
            // errorMessage: {
            //   maximum: `Maximum available is $${maxWithdraw.value}`,
            // },
          },
          chain: {
            type: 'string',
          },
          asset: {
            type: 'string',
          },
          destination_address: {
            type: 'string',
          },
        },
        type: 'object',
        required: fieldsPaths,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/WalletWithdraw',
  } as unknown as JSONSchemaType<WithdrawCryptoFormModel>));

  const schemaFrontend = schemaAddTransaction;
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<WithdrawCryptoFormModel>(
    schemaFrontend,
    schemaBackend,
    reactive({} as WithdrawCryptoFormModel),
    fieldsPaths
  );

  if (!model.chain) {
    model.chain = isWithdrawChain(selectedNetwork.value) ? selectedNetwork.value : defaultNetwork;
  }

  const chainOptions = computed<WithdrawChainOption[]>(() => {
    const chains = Array.isArray(getEvmWalletState.value.data?.chains) ? getEvmWalletState.value.data?.chains : [];
    const availableChainKeys = new Set(
      chains
        .map((chain) => String(chain.chain ?? '').trim().toLowerCase())
        .filter(isWithdrawChain),
    );
    const sourceOptions = availableChainKeys.size
      ? networkOptions.value.filter((option) => availableChainKeys.has(option.value))
      : networkOptions.value;

    return sourceOptions.map((option) => ({
      id: option.value,
      value: option.value,
      text: option.text || CHAIN_LABELS[option.value],
    }));
  });

  const preferredSelectedChain = computed<WithdrawChain | ''>(() =>
    chainOptions.value.find((item) => item.value === selectedNetwork.value)?.value
    ?? chainOptions.value.find((item) => item.value === defaultNetwork)?.value
    ?? chainOptions.value[0]?.value
    ?? ''
  );
  const selectedNetworkPresentation = computed(() => getWalletNetworkPresentation(model.chain || defaultNetwork));
  const networkHelperText = computed(() =>
    `Authorize this withdrawal on the ${selectedNetworkPresentation.value.warningLabel} network.`
  );
  const assetHelperText = computed(() =>
    `Choose which asset to withdraw on ${selectedNetworkPresentation.value.warningLabel}.`
  );
  const destinationAddressHelperText = computed(() =>
    `Send only to a ${selectedNetworkPresentation.value.warningLabel} address. Transfers to other networks may result in permanent loss.`
  );

  const isDisabledButton = computed(() => (!isValid.value || withdrawFundsState.value.loading));

  const createIdempotencyKey = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `wdr_${crypto.randomUUID()}`;
    }

    return `wdr_${Date.now()}`;
  };

  const getWalletAuthContext = (profileId: number) => ({
    profileId,
    profileType: selectedUserProfileData.value?.type,
    profileName: selectedUserProfileData.value?.name,
    fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
    userEmail: userSessionTraits.value?.email || selectedUserProfileData.value?.data?.email,
    walletStatus: selectedUserProfileData.value?.wallet?.status,
    isKycApproved: selectedUserProfileData.value?.isKycApproved,
  });

  const executeWithdrawal = async (
    profileId: number,
    submission: WithdrawCryptoSubmission,
  ) => {
    console.log('[wallet-withdraw] executeWithdrawal:start', {
      profileId,
      submission,
    });

    const authorizationResult = await authorizeOperation({
      profileId,
      request: {
        chain: submission.chain,
        asset_address: submission.asset_address,
        // max_amount: submission.amount,
        nonce: submission.idempotency_key,
      },
      walletAuthContext: getWalletAuthContext(profileId),
      onBeforeWalletAuth: () => {
        if (emitClose) {
          emitClose();
        }
      },
      onAuthRecovered: async () => {
        await executeWithdrawal(profileId, submission);
      },
    });
    console.log('[wallet-withdraw] executeWithdrawal:authorization-result', authorizationResult);

    if (authorizationResult.status !== 'authorized') {
      return;
    }

    console.log('[wallet-withdraw] executeWithdrawal:withdraw-request', {
      profileId,
      submission,
    });
    await evmRepository.withdrawFunds(profileId, submission);
    console.log('[wallet-withdraw] executeWithdrawal:withdraw-state', withdrawFundsState.value);
    if (withdrawFundsState.value.error) return;

    await evmRepository.getEvmWalletByProfile(profileId);
    console.log('[wallet-withdraw] executeWithdrawal:wallet-refresh:done', { profileId });
    toast({
      title: 'Withdrawal submitted',
      description: `${submission.amount} ${selectedAssetLabel.value} withdrawal submitted successfully.`,
      variant: 'success',
    });
    if (emitClose) emitClose();
  };

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormWithdrawCrypto'));
      return;
    }

    const profileId = Number(selectedUserProfileId.value ?? 0);
    if (!profileId) {
      return;
    }

    const idempotencyKey = model.idempotency_key || createIdempotencyKey();
    model.idempotency_key = idempotencyKey;

    const data: WithdrawCryptoSubmission = {
      chain: String(model.chain),
      asset_address: resolvedAssetIdentifier.value,
      amount: String(model.amount),
      destination_address: String(model.destination_address),
      idempotency_key: idempotencyKey,
    };
    console.log('[wallet-withdraw] saveHandler:validated-submit', {
      profileId,
      data,
    });
    await executeWithdrawal(profileId, data);
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => model.amount, (newAmount) => {
    if (Number(newAmount) === 0) {
      (model as any).amount = undefined;
    }
  });

  watch(() => selectedNetwork.value, (nextNetwork) => {
    if (!model.chain && isWithdrawChain(nextNetwork)) {
      model.chain = nextNetwork;
    }
  }, { immediate: true });

  watch([chainOptions, preferredSelectedChain], ([options, preferredChain]) => {
    if (!options.length || !preferredChain) {
      return;
    }

    if (!options.some((item) => item.value === model.chain)) {
      model.chain = preferredChain;
      return;
    }

    if (!model.chain) {
      model.chain = preferredChain;
    }
  }, { immediate: true });

  watch(() => model.chain, (nextChain) => {
    if (!nextChain || !isWithdrawChain(nextChain) || selectedNetwork.value === nextChain) {
      return;
    }

    selectedNetwork.value = nextChain;
  });

  // Helper function to format token data
  const formatToken = (item: IEvmWalletBalances): WithdrawTokenOption => ({
    ...item,
    text: `${item.name}: ${item.symbol}`,
    id: String(item.address ?? item.asset ?? item.symbol),
    value: String(item.address ?? item.asset ?? item.symbol),
  });

  const tokenFormatted = computed<WithdrawTokenOption[]>(() => {
    const balances = getEvmWalletState.value.data?.balances || [];
    const uniqueTokens = new Map<string, WithdrawTokenOption>();
    
    balances.forEach((item: IEvmWalletBalances, index: number) => {
      const key = normalizeAssetKey(item.address)
        || normalizeAssetKey(item.asset)
        || normalizeAssetKey(item.symbol)
        || `${item.name}:${index}`;
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, formatToken(item));
      }
    });
    
    return Array.from(uniqueTokens.values());
  });

  const selectedToken = computed(() => {
    const normalizedAsset = normalizeAssetKey(model.asset);
    if (!normalizedAsset) {
      return undefined;
    }

    return tokenFormatted.value.find((item) => (
      normalizeAssetKey(item.asset) === normalizedAsset
      || normalizeAssetKey(item.symbol) === normalizedAsset
      || normalizeAssetKey(item.address) === normalizedAsset
      || normalizeAssetKey(item.id) === normalizedAsset
      || normalizeAssetKey(item.value) === normalizedAsset
    ));
  });
  const resolvedAssetIdentifier = computed(() => (
    String(
      selectedToken.value?.address
      ?? selectedToken.value?.asset
      ?? selectedToken.value?.symbol
      ?? model.asset
      ?? ''
    ).trim()
  ));
  const maxWithdraw = computed((): number | undefined => selectedToken.value?.amount);
  const selectedAssetLabel = computed(() => (
    selectedToken.value?.symbol
    || selectedToken.value?.name
    || resolvedAssetIdentifier.value
    || 'asset'
  ));
  const availableAmountText = computed(() => {
    if (!selectedToken.value || maxWithdraw.value == null) {
      return 'Select an asset to view availability';
    }

    return `${maxWithdraw.value} ${selectedToken.value.symbol}`;
  });

  const tokenLastItem = computed(() => (
    tokenFormatted.value[0] || null
  ));

  watch(() => tokenFormatted.value, () => {
    if (!model.asset) model.asset = String(tokenLastItem.value?.id || '');
  }, { immediate: true });

  return {
    model,
    validation,
    isValid,
    isDisabledButton,
    onValidate,
    saveHandler,
    cancelHandler,
    availableAmountText,
    networkHelperText,
    assetHelperText,
    destinationAddressHelperText,
    errorData,
    schemaAddTransaction,
    chainOptions,
    tokenFormatted,
    numberFormatter,
    withdrawFundsState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
