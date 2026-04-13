import {
  computed, reactive, watch, nextTick, onMounted,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'UiKit/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { IEvmExchangeRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useWalletOperationAuthorization } from 'InvestCommon/features/wallet/logic/useWalletOperationAuthorization';
import { useWalletNetwork } from 'InvestCommon/features/wallet/logic/useWalletNetwork';

type ExchangeFormModel = {
  from?: string;
  to?: string;
  amount?: number;
};

type ExchangeSubmission = IEvmExchangeRequestBody;

export function useVFormExchange(
  emitClose?: () => void,
  defaultBuySymbol: string = 'USDC',
  poolId?: string,
  profileId?: string | number,
) {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, exchangeTokensState, exchangeTokensOptionsState } = storeToRefs(evmRepository);
  const earnRepository = useRepositoryEarn();
  const profilesStore = useProfilesStore();
  const sessionStore = useSessionStore();
  const { authorizeOperation } = useWalletOperationAuthorization();
  const { defaultNetwork, selectedNetwork } = useWalletNetwork();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);

  onMounted(() => {
    evmRepository.exchangeTokensOptions();
  });

  const formatToken = (item: any) => ({
    ...item,
    text: `${item.name}: ${item.symbol}`,
    id: item.address,
  });

  const USDC_FALLBACK_ID = '0xe2cCb3fc0153584e5C70c65849078b55597b4032';

  const tokenToFormatted = computed(() => {
    const balances = getEvmWalletState.value.data?.balances || [];
    const matchInBalances = (symbol: string) =>
      balances.find((item: any) =>
        item.symbol?.toLowerCase() === symbol?.toLowerCase()
        || item.name?.toLowerCase().includes(symbol?.toLowerCase() ?? '')
      );
    const symbol = defaultBuySymbol || 'USDC';
    const token = matchInBalances(symbol);
    if (token) return [formatToken(token)];
    return [{
      text: symbol,
      id: USDC_FALLBACK_ID,
      symbol,
      name: symbol === 'USDC' ? 'USD Coin' : symbol,
      ...(symbol === 'USDC' && { icon: '/img/tokens/usdc.svg' }),
    }];
  });

  const errorData = computed(() => (exchangeTokensState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => exchangeTokensOptionsState.value.data);
  const fieldsPaths = ['from', 'to', 'amount'];

  const selectedToken = computed(() => (
    getEvmWalletState.value.data?.balances?.find((item: IEvmWalletBalances) => item.address === model.from)));
  const maxExchange = computed((): number | undefined => selectedToken.value?.amount);

  const schemaExchangeTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      WalletExchange: {
        additionalProperties: true,
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          amount: {
            type: 'number',
            maximum: maxExchange.value,
            errorMessage: { maximum: `Maximum available is $${maxExchange.value}` },
          },
        },
        type: 'object',
        required: fieldsPaths,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/WalletExchange',
  } as unknown as JSONSchemaType<ExchangeFormModel>));

  const {
    model,
    isValid,
    onValidate,
    scrollToError, isFieldRequired, getErrorText,
  } = useFormValidation<ExchangeFormModel>(
    schemaExchangeTransaction,
    schemaBackend,
    reactive({
      to: tokenToFormatted.value[0]?.id,
    } as ExchangeFormModel),
    fieldsPaths
  );

  const isDisabledButton = computed(() => (!isValid.value || exchangeTokensState.value.loading));

  const receiveAmount = computed(() => {
    if (!model.amount || !selectedToken.value?.price_per_usd) return undefined;
    const amount = Number(model.amount);
    const pricePerUsd = Number(selectedToken.value.price_per_usd);
    return (amount * pricePerUsd).toFixed(6);
  });

  const exchangeRate = computed(() => {
    if (!selectedToken.value?.price_per_usd) return undefined;
    return Number(selectedToken.value.price_per_usd);
  });

  const destinationTokenSymbol = computed(() => {
    if (!model.to) return 'USDC';
    const destinationToken = tokenToFormatted.value.find((token: any) => token.id === model.to);
    return destinationToken?.symbol || defaultBuySymbol || 'USDC';
  });

  const fromTokenSymbol = computed(() => selectedToken.value?.symbol || 'Token');

  const exchangeRateLabel = computed(() => {
    if (!exchangeRate.value || !model.from) return undefined;
    return `1 ${fromTokenSymbol.value} = ${exchangeRate.value.toFixed(6)} ${destinationTokenSymbol.value}`;
  });

  const createIdempotencyKey = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `exc_${crypto.randomUUID()}`;
    }

    return `exc_${Date.now()}`;
  };

  const resolvedProfileId = computed(() => Number(profileId ?? selectedUserProfileId.value ?? 0));
  const authorizationChain = computed(() => String(selectedNetwork.value || defaultNetwork));
  const isEarnContext = computed(() => Boolean(defaultBuySymbol && poolId != null && profileId != null));
  const destinationAddress = computed(() => {
    const normalizedChain = authorizationChain.value.trim().toLowerCase();
    const chains = Array.isArray(getEvmWalletState.value.data?.chains) ? getEvmWalletState.value.data.chains : [];
    const matchingChainAddress = chains.find((chain) =>
      String(chain.chain ?? '').trim().toLowerCase() === normalizedChain
    )?.wallet_address;
    const normalizedMatchingChainAddress = String(matchingChainAddress ?? '').trim();

    if (normalizedMatchingChainAddress) {
      return normalizedMatchingChainAddress;
    }

    const depositInstructionChain = String(
      getEvmWalletState.value.data?.deposit_instructions?.chain ?? '',
    ).trim().toLowerCase();
    const depositInstructionAddress = String(
      getEvmWalletState.value.data?.deposit_instructions?.address ?? '',
    ).trim();

    if (depositInstructionAddress && (!depositInstructionChain || depositInstructionChain === normalizedChain)) {
      return depositInstructionAddress;
    }

    const fallbackAddress = String(getEvmWalletState.value.data?.address ?? '').trim();
    const hasChains = chains.length > 0;
    if (!hasChains && normalizedChain === defaultNetwork && fallbackAddress) {
      return fallbackAddress;
    }

    return undefined;
  });

  const getWalletAuthContext = (currentProfileId: number) => ({
    profileId: currentProfileId,
    profileType: selectedUserProfileData.value?.type,
    profileName: selectedUserProfileData.value?.name,
    fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
    userEmail: userSessionTraits.value?.email || selectedUserProfileData.value?.data?.email,
    walletStatus: selectedUserProfileData.value?.wallet?.status,
    isKycApproved: selectedUserProfileData.value?.isKycApproved,
  });

  const submitExchange = async (
    currentProfileId: number,
    data: ExchangeSubmission,
  ) => {
    await evmRepository.exchangeTokens(currentProfileId, data);

    if (exchangeTokensState.value.error) {
      return false;
    }

    if (isEarnContext.value) {
      await evmRepository.getEvmWalletByProfile(currentProfileId);
      await earnRepository.getPositions(String(poolId), profileId as string | number);
      return true;
    }

    await evmRepository.getEvmWalletByProfile(currentProfileId);
    return true;
  };

  const executeExchange = async (
    currentProfileId: number,
    data: ExchangeSubmission,
  ) => {
    try {
      const authorizationResult = await authorizeOperation({
        profileId: currentProfileId,
        request: {
          chain: data.chain,
          asset_address: data.asset_address,
          to_asset_address: data.to_asset_address,
          max_amount: data.amount,
          nonce: data.idempotency_key,
        },
        walletAuthContext: getWalletAuthContext(currentProfileId),
        onBeforeWalletAuth: () => {
          if (emitClose) {
            emitClose();
          }
        },
        onAuthRecovered: async () => {
          await executeExchange(currentProfileId, data);
        },
      });

      if (authorizationResult.status !== 'authorized') {
        return;
      }

      const isSubmitted = await submitExchange(currentProfileId, data);
      if (isSubmitted && emitClose) emitClose();
    } catch (error) {
      reportError(error, 'Failed to exchange tokens');
    }
  };

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormExchange'));
      return;
    }

    const currentProfileId = resolvedProfileId.value;
    if (!currentProfileId) {
      return;
    }

    const nextDestinationAddress = destinationAddress.value;
    if (!nextDestinationAddress) {
      return;
    }

    const idempotencyKey = createIdempotencyKey();
    const data: ExchangeSubmission = {
      chain: authorizationChain.value,
      asset_address: String(model.from),
      to_asset_address: String(model.to),
      amount: String(model.amount),
      destination_address: nextDestinationAddress,
      idempotency_key: idempotencyKey,
    };

    await executeExchange(currentProfileId, data);
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => model.amount, () => {
    if (Number(model.amount) === 0) delete (model as any).amount;
  });

  const getUniqueTokens = (balances: any[], filterFn?: (item: any) => boolean) => {
    const uniqueTokens = new Map();
    const filteredBalances = filterFn ? balances.filter(filterFn) : balances;
    filteredBalances.forEach((item: any) => {
      const key = `${item.name}:${item.symbol}`;
      if (!uniqueTokens.has(key)) uniqueTokens.set(key, formatToken(item));
    });
    return Array.from(uniqueTokens.values());
  };

  const tokenFormatted = computed(() =>
    getUniqueTokens(getEvmWalletState.value.data?.balances || [])
  );

  const tokensFromFormatted = computed(() =>
    getUniqueTokens(
      getEvmWalletState.value.data?.balances || [],
      defaultBuySymbol ? undefined : (item: any) => !item.name?.toLowerCase().includes('usdc')
    )
  );

  const tokenLastItem = computed(() => tokenFormatted.value[0] || null);

  watch(() => tokenFormatted.value, () => {
    if (!model.from) model.from = String(tokenLastItem.value?.id || '');
  }, { immediate: true });

  return {
    model,
    isValid,
    isDisabledButton,
    onValidate,
    saveHandler,
    cancelHandler,
    maxExchange,
    errorData,
    tokenFormatted,
    tokenToFormatted,
    tokensFromFormatted,
    numberFormatter,
    exchangeTokensState,
    isFieldRequired,
    getErrorText,
    scrollToError,
    receiveAmount,
    exchangeRate,
    selectedToken,
    destinationTokenSymbol,
    fromTokenSymbol,
    exchangeRateLabel,
  };
}
