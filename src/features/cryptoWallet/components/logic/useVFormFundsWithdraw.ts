import {
  computed, reactive, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { IEvmWithdrawRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export function useVFormFundsWithdraw(
  emitClose?: () => void,
) {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, withdrawFundsState } = storeToRefs(evmRepository);
    const profilesStore = useProfilesStore();
    const { selectedUserProfileId } = storeToRefs(profilesStore);

  const selectedToken = computed(() => (
    getEvmWalletState.value.data?.balances?.find((item: IEvmWalletBalances) => item.address === model.token)));
  const maxWithdraw = computed((): number | undefined => selectedToken.value?.amount);
  const text = computed(() => `available ${maxWithdraw.value}`);

  const errorData = computed(() => (withdrawFundsState.value.error as any)?.data?.responseJson);
  const fieldsPaths = ['amount', 'token', 'to', 'wallet_id'];

  const schemaAddTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Individual: {
        properties: {
          amount: {
            type: 'number',
            maximum: maxWithdraw.value,
            errorMessage: {
              maximum: `Maximum available is $${maxWithdraw.value}`,
            },
          },
          token: {
            type: 'string',
          },
          to: {
            type: 'string',
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
  } as unknown as JSONSchemaType<IEvmWithdrawRequestBody>));


  const schemaFrontend = schemaAddTransaction;
  // Pass undefined directly for backend schema
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<IEvmWithdrawRequestBody>(
    schemaFrontend,
    undefined,
    reactive({
      wallet_id: getEvmWalletState.value.data?.id
    } as IEvmWithdrawRequestBody),
    fieldsPaths
  );

  const isDisabledButton = computed(() => (!isValid.value || withdrawFundsState.value.loading));

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormWalletAddTransaction'));
      return;
    }
    const data: IEvmWithdrawRequestBody = {
      amount: Number(model.amount),
      token: String(model.token),
      to: String(model.to),
      wallet_id: Number(model.wallet_id),
    };
    await evmRepository.withdrawFunds(data);
    if (getEvmWalletState.value.error) return;

    evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => getEvmWalletState.value.data, () => {
    if (model.wallet_id) model.wallet_id = getEvmWalletState.value.data?.id;
  }, { immediate: true });

  const tokenFormatted = computed(() => {
    const balances = getEvmWalletState.value.data?.balances || [];
    const uniqueTokens = new Map();
    
    balances.forEach((item: any) => {
      const key = `${item.name}:${item.symbol}`;
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, {
          text: `${item.name}: ${item.symbol}`,
          id: `${item.address}`,
        });
      }
    });
    
    return Array.from(uniqueTokens.values());
  });

  const tokenLastItem = computed(() => (
    tokenFormatted.value[tokenFormatted.value.length - 1] || null
  ));

  watch(() => tokenFormatted.value, () => {
    if (!model.token) model.token = String(tokenLastItem.value?.id || '');
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
    schemaAddTransaction,
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
