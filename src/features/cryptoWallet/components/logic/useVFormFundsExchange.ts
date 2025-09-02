import {
  computed, reactive, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { IEvmExchangeRequestBody } from 'InvestCommon/data/evm/evm.types';

export function useVFormFundsExchange(
  emitClose?: () => void,
) {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, exchangeTokensState } = storeToRefs(evmRepository);

  const selectedFromToken = computed(() => (
    getEvmWalletState.value.data?.balances?.find((item: any) => item.address === model.from)));
  const maxExchange = computed(() => selectedFromToken.value?.amount);
  const schemaMaximum = computed(() => maxExchange.value);
  const schemaMaximumError = computed(() => `Maximum available is $${maxExchange.value}`);
  const text = computed(() => `available ${maxExchange.value}`);

  const tokenToFormatted = computed(() => (
    [{ text: 'USDC', id: '0xe2cCb3fc0153584e5C70c65849078b55597b4032' }]
  ));

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
            // maximum: schemaMaximum.value,
            // errorMessage: {
            //   maximum: schemaMaximumError.value,
            // },
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
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => getEvmWalletState.value.data, () => {
    if (model.wallet_id) model.wallet_id = getEvmWalletState.value.data?.id;
  }, { immediate: true });

  const tokenFormatted = computed(() => (
    getEvmWalletState.value.data?.balances?.map((item: any) => ({
      text: `${item.name}: ${item.symbol}`,
      id: `${item.address}`,
    })) || []
  ));

  const tokenLastItem = computed(() => (
    tokenFormatted.value[0]
  ));

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
    numberFormatter,
    exchangeTokensState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
