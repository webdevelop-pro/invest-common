import {
  computed, reactive, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { IEvmExchangeRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';

export function useVFormFundsExchange(
  emitClose?: () => void,
) {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, exchangeTokensState } = storeToRefs(evmRepository);

  // Helper function to format token data
  const formatToken = (item: any) => ({
    ...item,
    text: `${item.name}: ${item.symbol}`,
    id: item.address,
  });


  const tokenToFormatted = computed(() => {
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
  const fieldsPaths = ['from', 'to', 'amount', 'wallet_id'];

  const schemaExchangeTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Individual: {
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
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<IEvmExchangeRequestBody>));

  const schemaFrontend = schemaExchangeTransaction;
  // Pass undefined directly for backend schema
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<IEvmExchangeRequestBody>(
    schemaFrontend,
    undefined,
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
    console.log('model.amount', model.amount);
    console.log('selectedToken.value?.price_per_usd', selectedToken.value);
    if (!model.amount || !selectedToken.value?.price_per_usd) return undefined;
    const amount = Number(model.amount);
    const pricePerUsd = Number(selectedToken.value.price_per_usd);
    console.log('amount', (amount * pricePerUsd).toFixed(6));
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
    const data: IEvmExchangeRequestBody = {
      from: String(model.from),
      to: String(model.to),
      amount: Number(model.amount),
      wallet_id: Number(model.wallet_id),
    };
    await evmRepository.exchangeTokens(data);
    if (getEvmWalletState.value.error) return;
    
    // evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => getEvmWalletState.value.data, () => {
    if (model.wallet_id) model.wallet_id = getEvmWalletState.value.data?.id;
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
      (item: any) => !item.name?.toLowerCase().includes('usdc')
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
