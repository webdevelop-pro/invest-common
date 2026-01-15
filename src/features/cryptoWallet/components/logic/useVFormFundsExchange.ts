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

export function useVFormFundsExchange(
  emitClose?: () => void,
  defaultBuySymbol?: string,
  poolId?: string,
  profileId?: string | number,
) {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, exchangeTokensState, exchangeTokensOptionsState } = storeToRefs(evmRepository);
  const earnRepository = useRepositoryEarn();

  // Call options request when component is mounted
  onMounted(() => {
    evmRepository.exchangeTokensOptions();
  });

  // Helper function to format token data
  const formatToken = (item: any) => ({
    ...item,
    text: `${item.name}: ${item.symbol}`,
    id: item.address,
  });

  const tokenToFormatted = computed(() => {
    if (defaultBuySymbol) return [{
      text: defaultBuySymbol, 
      id: '0xe2cCb3fc0153584e5C70c65849078b55597b4032',
      symbol: defaultBuySymbol,
      name: defaultBuySymbol
    }];
    const balances = getEvmWalletState.value.data?.balances || [];
    const usdcToken = balances.find((item: any) => 
      item.name?.toLowerCase().includes('usdc')
    );
    
    return usdcToken ? [formatToken(usdcToken)] : [{
      text: 'USDC', 
      id: '0xe2cCb3fc0153584e5C70c65849078b55597b4032',
      icon: '/img/tokens/usdc.svg',
      symbol: 'USDC',
      name: 'USD Coin'
    }];
  });

  const errorData = computed(() => (exchangeTokensState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => exchangeTokensOptionsState.value.data);
  const fieldsPaths = ['from', 'to', 'amount', 'wallet_id'];

  const schemaExchangeTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      WalletExchange: {
        additionalProperties: true,
        properties: {
          from: {
            type: 'string',
          },
          to: {
            type: 'string',
          },
          amount: {
            type: 'number',
            maximum: maxExchange.value,
            errorMessage: {
              maximum: `Maximum available is $${maxExchange.value}`,
            },
          },
          wallet_id: {
            type: 'number',
          },
        },
        type: 'object',
        required: fieldsPaths,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/WalletExchange',
  } as unknown as JSONSchemaType<IEvmExchangeRequestBody>));

  const schemaFrontend = schemaExchangeTransaction;
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<IEvmExchangeRequestBody>(
    schemaFrontend,
    schemaBackend,
    reactive({
      wallet_id: getEvmWalletState.value.data?.id,
      to: tokenToFormatted.value[0].id,
    } as IEvmExchangeRequestBody),
    fieldsPaths
  );

  const isDisabledButton = computed(() => (!isValid.value || exchangeTokensState.value.loading));

  const selectedToken = computed(() => (
    getEvmWalletState.value.data?.balances?.find((item: IEvmWalletBalances) => item.address === model.from)));
  const maxExchange = computed((): number | undefined => selectedToken.value?.amount);
  const text = computed(() => `available ${maxExchange.value}`);

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

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormWalletExchangeTransaction'));
      return;
    }
    const amount = Number(model.amount);

    // If opened from Earn (defaultBuySymbol provided), mock exchange in positionsPools
    if (defaultBuySymbol) {
      const fromSymbol = selectedToken.value?.symbol || 'USDC';

      earnRepository.mockExchangePositions({
        profileId: profileId as string | number,
        fromSymbol,
        toSymbol: defaultBuySymbol,
        toPoolId: poolId as string,
        amount,
      });

      if (emitClose) emitClose();
      return;
    }

    const data: IEvmExchangeRequestBody = {
      from: String(model.from),
      to: String(model.to),
      amount,
      wallet_id: Number(model.wallet_id),
    };
    await evmRepository.exchangeTokens(data);
    if (getEvmWalletState.value.error) return;

    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => model.amount, () => {
    if (Number(model.amount) === 0) {
      delete (model as any).amount;
    }
  });

  watch(() => getEvmWalletState.value.data, () => {
    if (model.wallet_id && getEvmWalletState.value.data?.id) {
      model.wallet_id = getEvmWalletState.value.data.id;
    }
  }, { immediate: true });

  // Helper function to get unique tokens from balances
  const getUniqueTokens = (balances: any[], filterFn?: (item: any) => boolean) => {
    const uniqueTokens = new Map();
    const filteredBalances = filterFn ? balances.filter(filterFn) : balances;
    
    filteredBalances.forEach((item: any) => {
      const key = `${item.name}:${item.symbol}`;
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, formatToken(item));
      }
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
    validation,
    isValid,
    isDisabledButton,
    onValidate,
    saveHandler,
    cancelHandler,
    text,
    errorData,
    schemaExchangeTransaction,
    tokenFormatted,
    tokenToFormatted,
    tokensFromFormatted,
    numberFormatter,
    exchangeTokensState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
    receiveAmount,
    exchangeRate,
    selectedToken,
  };
}
