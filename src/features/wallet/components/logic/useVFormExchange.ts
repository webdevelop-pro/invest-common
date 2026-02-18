import {
  computed, reactive, watch, nextTick, onMounted,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { IEvmExchangeRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

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
  const { selectedUserProfileId } = storeToRefs(profilesStore);

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
  const fieldsPaths = ['from', 'to', 'amount', 'wallet_id'];

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
          wallet_id: { type: 'number' },
        },
        type: 'object',
        required: fieldsPaths,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/WalletExchange',
  } as unknown as JSONSchemaType<IEvmExchangeRequestBody>));

  const {
    model,
    isValid,
    onValidate,
    scrollToError, isFieldRequired, getErrorText,
  } = useFormValidation<IEvmExchangeRequestBody>(
    schemaExchangeTransaction,
    schemaBackend,
    reactive({
      wallet_id: getEvmWalletState.value.data?.id,
      to: tokenToFormatted.value[0]?.id,
    } as IEvmExchangeRequestBody),
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

  const handleEarnExchange = async (fromAmount: number) => {
    if (!defaultBuySymbol || !poolId || !profileId) return;
    const data: IEvmExchangeRequestBody = {
      from: String(model.from),
      to: String(model.to),
      amount: fromAmount,
      wallet_id: Number(model.wallet_id),
    };
    await evmRepository.exchangeTokens(data);
    if (!getEvmWalletState.value.error) {
      // Refresh wallet and Earn positions for this pool/profile to reflect backend state
      await evmRepository.getEvmWalletByProfile(Number(profileId));
      await earnRepository.getPositions(poolId, profileId);
    }
  };

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormExchange'));
      return;
    }
    const fromAmount = Number(model.amount);
    const isEarnContext = defaultBuySymbol && poolId != null && profileId != null;
    if (isEarnContext) {
      await handleEarnExchange(fromAmount);
      if (emitClose) emitClose();
      return;
    }
    const data: IEvmExchangeRequestBody = {
      from: String(model.from),
      to: String(model.to),
      amount: fromAmount,
      wallet_id: Number(model.wallet_id),
    };
    await evmRepository.exchangeTokens(data);
    if (!getEvmWalletState.value.error && selectedUserProfileId.value) {
      // Global wallet context: refresh wallet data after successful exchange.
      await evmRepository.getEvmWalletByProfile(Number(selectedUserProfileId.value));
    }
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => model.amount, () => {
    if (Number(model.amount) === 0) delete (model as any).amount;
  });

  watch(() => getEvmWalletState.value.data, () => {
    if (model.wallet_id && getEvmWalletState.value.data?.id) {
      model.wallet_id = getEvmWalletState.value.data.id;
    }
  }, { immediate: true });

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
